import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

const languageToCompiler: Record<string, string> = {
  pascal: 'fpc-3.2.2',
  python: 'cpython-3.13.8',
  cpp: 'gcc-13.2.0',
  csharp: 'dotnetcore-8.0.402',
  java: 'openjdk-jdk-21+35',
  javascript: 'nodejs-20.17.0',
};

@Injectable()
export class CodeSandboxService implements OnModuleInit {
  private readonly logger = new Logger(CodeSandboxService.name);
  private isDockerAvailable = false;
  private readonly dockerImageName = 'pascal-sandbox-runner';

  async onModuleInit() {
    try {
      this.logger.log('Checking for Docker presence...');
      execSync('docker --version', { stdio: 'ignore' });
      this.isDockerAvailable = true;
      this.logger.log('Docker is available. Setting up Pascal runner image...');

      // Ensure sandbox image exists
      try {
        execSync(`docker image inspect ${this.dockerImageName}`, { stdio: 'ignore' });
        this.logger.log(`Docker image ${this.dockerImageName} already exists.`);
      } catch {
        this.logger.log(`Building Docker image ${this.dockerImageName}...`);
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pascal-docker-build-'));
        const dockerfilePath = path.join(tempDir, 'Dockerfile');
        // Install FPC and other standard build utilities
        fs.writeFileSync(dockerfilePath, 'FROM alpine:3.18\nRUN apk add --no-cache fpc build-base\n');
        
        execSync(`docker build -t ${this.dockerImageName} "${tempDir}"`, { stdio: 'ignore' });
        // Cleanup temp build files
        fs.rmSync(tempDir, { recursive: true, force: true });
        this.logger.log(`Docker image ${this.dockerImageName} built successfully.`);
      }
    } catch (err) {
      this.logger.warn('Docker is not running or not installed. Falling back to online Wandbox compiler API.');
      this.isDockerAvailable = false;
    }
  }

  async runCode(
    code: string,
    language: string,
    stdin: string = ''
  ): Promise<{
    status: number;
    stdout: string;
    stderr: string;
    compilerMessage: string;
  }> {
    const langKey = (language || 'pascal').toLowerCase();

    // If Docker is available and language is Pascal, run in Docker container
    if (this.isDockerAvailable && langKey === 'pascal') {
      return this.runInDocker(code, stdin);
    }

    // Fallback/Default to Wandbox API execution
    return this.runInWandbox(code, langKey, stdin);
  }

  private async runInDocker(
    code: string,
    stdin: string
  ): Promise<{
    status: number;
    stdout: string;
    stderr: string;
    compilerMessage: string;
  }> {
    const runId = Math.random().toString(36).substring(2, 10);
    const hostTempDir = fs.mkdtempSync(path.join(os.tmpdir(), `sandbox-run-${runId}-`));
    
    const sourceFile = path.join(hostTempDir, 'program.pas');
    const stdinFile = path.join(hostTempDir, 'input.txt');
    
    fs.writeFileSync(sourceFile, code);
    fs.writeFileSync(stdinFile, stdin);

    // Prepare Unix-friendly mount path for Docker Desktop on Windows
    let dockerVolumePath = hostTempDir;
    if (process.platform === 'win32') {
      // Normalize slashes and format drive letters
      dockerVolumePath = hostTempDir.replace(/\\/g, '/');
    }

    // Execution limits: 64MB memory, 0.5 CPU, no network, 2s timeout
    const dockerCmd = `docker run --rm --network none -m 64m --cpus 0.5 -v "${dockerVolumePath}":/code ${this.dockerImageName} sh -c "fpc -O2 /code/program.pas -o/code/program > /code/compiler.log 2>&1 && /code/program < /code/input.txt"`;

    try {
      this.logger.log(`Executing Pascal code locally in Docker sandbox (run ID: ${runId})...`);
      
      const { stdout } = await execAsync(dockerCmd, {
        timeout: 2000, // Timeout after 2000ms
        maxBuffer: 1024 * 1024 // 1MB buffer limit
      });

      const compilerLogPath = path.join(hostTempDir, 'compiler.log');
      const compilerMessage = fs.existsSync(compilerLogPath) 
        ? fs.readFileSync(compilerLogPath, 'utf8') 
        : '';

      return {
        status: 0,
        stdout: stdout,
        stderr: '',
        compilerMessage: compilerMessage
      };
    } catch (err: any) {
      this.logger.warn(`Docker execution run ${runId} finished with error / timeout: ${err.message}`);
      
      const compilerLogPath = path.join(hostTempDir, 'compiler.log');
      const compilerMessage = fs.existsSync(compilerLogPath) 
        ? fs.readFileSync(compilerLogPath, 'utf8') 
        : '';

      let stderr = err.stderr || '';
      if (err.killed) {
        stderr = 'Превышен лимит времени выполнения (2 сек)';
      } else if (err.message.includes('exit code 137') || err.message.includes('137')) {
        stderr = 'Превышен лимит памяти (64 Мб)';
      } else if (!stderr) {
        stderr = err.message;
      }

      return {
        status: err.code || -1,
        stdout: '',
        stderr: stderr,
        compilerMessage: compilerMessage
      };
    } finally {
      // Clean up temporary workspace directory and its contents
      try {
        fs.rmSync(hostTempDir, { recursive: true, force: true });
      } catch (cleanupErr: any) {
        this.logger.error(`Failed to clean up sandbox directory ${hostTempDir}: ${cleanupErr.message}`);
      }
    }
  }

  private async runInWandbox(
    code: string,
    langKey: string,
    stdin: string
  ): Promise<{
    status: number;
    stdout: string;
    stderr: string;
    compilerMessage: string;
  }> {
    const compiler = languageToCompiler[langKey] || 'fpc-3.2.2';
    try {
      this.logger.log(`Executing ${langKey} code using compiler ${compiler} on Wandbox...`);
      
      const response = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler,
          code,
          stdin,
        }),
      });

      if (!response.ok) {
        throw new Error(`Wandbox returned status code ${response.status}`);
      }

      const data: any = await response.json();

      const stdout = data.program_output || '';
      const stderr = data.program_error || '';
      const compilerMessage = data.compiler_output || data.compiler_error || '';
      const status = typeof data.status === 'number' ? data.status : (compilerMessage ? -1 : 0);

      return {
        status,
        stdout,
        stderr,
        compilerMessage,
      };
    } catch (error: any) {
      this.logger.error(`Failed to execute code on Wandbox: ${error.message}`);
      return {
        status: -99,
        stdout: '',
        stderr: `Ошибка запуска: ${error.message}`,
        compilerMessage: 'Не удалось связаться с сервером компиляции Wandbox.',
      };
    }
  }
}
