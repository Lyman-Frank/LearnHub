import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface GalleryImage {
  id: string;
  url: string;
  label: string;
  category: string;
  isCustom: boolean; // false = встроенная, true = загружена админом
}

export interface GalleryData {
  categories: Record<string, GalleryImage[]>;
}

// Встроенные изображения по умолчанию
const DEFAULT_GALLERY: GalleryData = {
  categories: {
    'Математика': [
      { id: 'math-1', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300&h=200&fit=crop', label: 'Формулы', category: 'Математика', isCustom: false },
      { id: 'math-2', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=200&fit=crop', label: 'Уравнения', category: 'Математика', isCustom: false },
      { id: 'math-3', url: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=300&h=200&fit=crop', label: 'Геометрия', category: 'Математика', isCustom: false },
      { id: 'math-4', url: 'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=300&h=200&fit=crop', label: 'Числа', category: 'Математика', isCustom: false },
    ],
    'Физика': [
      { id: 'phys-1', url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&h=200&fit=crop', label: 'Атом', category: 'Физика', isCustom: false },
      { id: 'phys-2', url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=300&h=200&fit=crop', label: 'Лаборатория', category: 'Физика', isCustom: false },
      { id: 'phys-3', url: 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=300&h=200&fit=crop', label: 'Электричество', category: 'Физика', isCustom: false },
      { id: 'phys-4', url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=300&h=200&fit=crop', label: 'Космос', category: 'Физика', isCustom: false },
    ],
    'История': [
      { id: 'hist-1', url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300&h=200&fit=crop', label: 'Архитектура', category: 'История', isCustom: false },
      { id: 'hist-2', url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=200&fit=crop', label: 'Карта', category: 'История', isCustom: false },
      { id: 'hist-3', url: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=300&h=200&fit=crop', label: 'Рукопись', category: 'История', isCustom: false },
      { id: 'hist-4', url: 'https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=300&h=200&fit=crop', label: 'Памятник', category: 'История', isCustom: false },
    ],
    'Информатика': [
      { id: 'cs-1', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop', label: 'Схема', category: 'Информатика', isCustom: false },
      { id: 'cs-2', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=200&fit=crop', label: 'Сеть', category: 'Информатика', isCustom: false },
      { id: 'cs-3', url: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=300&h=200&fit=crop', label: 'База данных', category: 'Информатика', isCustom: false },
      { id: 'cs-4', url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=300&h=200&fit=crop', label: 'Компьютер', category: 'Информатика', isCustom: false },
    ],
    'Программирование': [
      { id: 'prog-1', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=200&fit=crop', label: 'Код', category: 'Программирование', isCustom: false },
      { id: 'prog-2', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop', label: 'Синтаксис', category: 'Программирование', isCustom: false },
      { id: 'prog-3', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=200&fit=crop', label: 'Разработка', category: 'Программирование', isCustom: false },
      { id: 'prog-4', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop', label: 'Алгоритм', category: 'Программирование', isCustom: false },
    ],
    'Биология': [
      { id: 'bio-1', url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&h=200&fit=crop', label: 'Клетка', category: 'Биология', isCustom: false },
      { id: 'bio-2', url: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=300&h=200&fit=crop', label: 'ДНК', category: 'Биология', isCustom: false },
      { id: 'bio-3', url: 'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=300&h=200&fit=crop', label: 'Природа', category: 'Биология', isCustom: false },
      { id: 'bio-4', url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=300&h=200&fit=crop', label: 'Микроскоп', category: 'Биология', isCustom: false },
    ],
  },
};

@Injectable()
export class GalleryService implements OnModuleInit {
  private readonly dataPath = join(__dirname, '..', '..', 'public', 'gallery.json');
  private gallery: GalleryData = DEFAULT_GALLERY;

  onModuleInit() {
    this.load();
  }

  private load() {
    if (existsSync(this.dataPath)) {
      try {
        const raw = readFileSync(this.dataPath, 'utf-8');
        this.gallery = JSON.parse(raw);
      } catch {
        this.gallery = { ...DEFAULT_GALLERY };
        this.save();
      }
    } else {
      this.gallery = { ...DEFAULT_GALLERY };
      this.save();
    }
  }

  private save() {
    writeFileSync(this.dataPath, JSON.stringify(this.gallery, null, 2), 'utf-8');
  }

  getAll(): GalleryData {
    return this.gallery;
  }

  getCategories(): string[] {
    return Object.keys(this.gallery.categories);
  }

  addImage(category: string, url: string, label: string): GalleryImage {
    const { v4: uuidv4 } = require('uuid');
    const image: GalleryImage = {
      id: uuidv4(),
      url,
      label,
      category,
      isCustom: true,
    };
    if (!this.gallery.categories[category]) {
      this.gallery.categories[category] = [];
    }
    this.gallery.categories[category].push(image);
    this.save();
    return image;
  }

  deleteImage(imageId: string): boolean {
    let found = false;
    for (const category of Object.keys(this.gallery.categories)) {
      const before = this.gallery.categories[category].length;
      this.gallery.categories[category] = this.gallery.categories[category].filter(
        (img) => img.id !== imageId
      );
      if (this.gallery.categories[category].length < before) {
        found = true;
      }
    }
    if (found) this.save();
    return found;
  }

  addCategory(name: string): void {
    if (!this.gallery.categories[name]) {
      this.gallery.categories[name] = [];
      this.save();
    }
  }

  deleteCategory(name: string): void {
    delete this.gallery.categories[name];
    this.save();
  }
}
