import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CodeSandboxService } from '../progress/code-sandbox.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private prisma: PrismaService,
    private codeSandboxService: CodeSandboxService,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.logger.log('Gemini API key is configured. Initializing GoogleGenerativeAI...');
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not defined in the environment. AI Tutor will be disabled.');
    }
  }

  isApiConfigured(): boolean {
    return this.genAI !== null;
  }

  async getAiHintForStep(userId: string, stepId: string, code: string): Promise<{ hint: string }> {
    // 1. Проверяем тип шага
    const step = await this.prisma.step.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new NotFoundException('Шаг не найден');
    }

    if (step.type !== 'CODE') {
      throw new BadRequestException('ИИ-помощник доступен только для кодовых задач');
    }

    // 2. Проверяем кэш (если студент отправляет точно такой же код, отдаем кэшированную подсказку)
    const normalizedCode = code.trim();
    const cachedHint = await this.prisma.aiHint.findFirst({
      where: {
        userId,
        stepId,
        code: normalizedCode,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (cachedHint) {
      this.logger.log(`Returning cached AI hint for user ${userId} and step ${stepId}`);
      return { hint: cachedHint.hint };
    }

    // 3. Если ИИ-ключ не настроен, возвращаем информативную заглушку
    if (!this.genAI) {
      return {
        hint: '🤖 **ИИ-Наставник временно недоступен.**\n\nДля включения подсказок преподаватель должен добавить ключ `GEMINI_API_KEY` в переменные окружения сервера (файл `.env`).',
      };
    }

    // 4. Сбор контекста задачи
    let parsedContent: any = {};
    try {
      parsedContent = typeof step.content === 'string' ? JSON.parse(step.content) : step.content;
    } catch (e) {
      // ignore
    }

    const description = parsedContent?.description || 'Инструкция отсутствует.';
    const language = parsedContent?.language || 'pascal';
    const testCases = parsedContent?.testCases || [];
    
    // 5. Тестируем код в песочнице на первом тест-кейсе, чтобы получить лог ошибки
    let sandboxResultStr = 'Код не запускался в песочнице.';
    let firstTestCase = testCases[0];

    if (firstTestCase) {
      try {
        const res = await this.codeSandboxService.runCode(code, language, firstTestCase.input);
        if (res.status === 0) {
          sandboxResultStr = `Код компилируется.\nВыходные данные (stdout): "${res.stdout}"\nОжидалось: "${firstTestCase.expected}"`;
        } else {
          sandboxResultStr = `Ошибка выполнения/компиляции!\nКомпилятор/Ошибка: ${res.compilerMessage || ''}\nStderr: ${res.stderr || ''}`;
        }
      } catch (err: any) {
        sandboxResultStr = `Ошибка запуска песочницы: ${err.message}`;
      }
    }

    // 6. Формирование промпта
    const prompt = `Ты — заботливый, профессиональный и опытный преподаватель программирования.
Студент решает практическую задачу по программированию и застрял. Ему нужна подсказка.

Язык программирования: ${language}
Название задачи: "${step.title}"
Описание (условие) задачи:
${description}

${firstTestCase ? `Пример тест-кейса:\nВвод (stdin): "${firstTestCase.input}"\nОжидаемый вывод (stdout): "${firstTestCase.expected}"` : ''}

Текущий код студента:
\`\`\`${language}
${code}
\`\`\`

Результат запуска кода на тесте:
${sandboxResultStr}

Твоя задача — проанализировать код студента и лог ошибки, найти неточность/баг (синтаксическую или логическую) и дать наводящую подсказку на русском языке (максимум 2-3 коротких предложения).

КРИТИЧЕСКИ ВАЖНО:
1. Ни в коем случае НЕ давай готовое решение, правильный код или исправленные строки кода! Студент должен исправить ошибку сам.
2. Не говори "напиши вот так..." или "правильный вариант...".
3. Вместо этого направь его: укажи на конкретную строку, неверный тип данных, некорректное использование функции, забытый знак препинания или ошибку в условии.
4. Отвечай дружелюбно, поддерживающе и конструктивно. Используй markdown.`;

    try {
      this.logger.log(`Calling Gemini API for step ${stepId} (user: ${userId})...`);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const finalHint = text ? text.trim() : 'Хм, не удалось сформулировать подсказку. Попробуй перепроверить логику программы!';

      // 7. Кэшируем подсказку в базе данных
      await this.prisma.aiHint.create({
        data: {
          userId,
          stepId,
          code: normalizedCode,
          hint: finalHint,
        },
      });

      return { hint: finalHint };
    } catch (err: any) {
      this.logger.error(`Error generating AI hint: ${err.message}`, err.stack);
      return {
        hint: `🤖 **Не удалось связаться с ИИ-Наставником.**\n\nПроизошла ошибка при генерации ответа: ${err.message}. Пожалуйста, попробуйте позже!`,
      };
    }
  }
}
