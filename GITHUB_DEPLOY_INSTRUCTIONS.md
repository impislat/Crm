# 🚀 Инструкция по деплою на GitHub Pages

Я настроил ваш проект для автоматического деплоя на GitHub Pages!

## Что было сделано:

✅ Добавлен `base: '/Crm/'` в `vite.config.ts`  
✅ Создан `index.html` в корне проекта  
✅ Создан `src/main.tsx` как точка входа  
✅ Настроен GitHub Actions workflow (`.github/workflows/deploy.yml`)  
✅ Создан `.gitignore`  

## Что нужно сделать:

### Шаг 1: Закоммитьте и запушьте изменения

Если вы используете интеграцию Figma с GitHub - просто синхронизируйте изменения.

Или вручную через Git:

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push
```

### Шаг 2: Настройте GitHub Pages

1. Зайдите в настройки репозитория: https://github.com/impislat/Crm/settings/pages
2. В разделе "Build and deployment"
3. **Source**: выберите **"GitHub Actions"** (НЕ "Deploy from a branch"!)
4. Сохраните изменения

### Шаг 3: Дождитесь деплоя

1. Зайдите во вкладку **Actions**: https://github.com/impislat/Crm/actions
2. Там должен запуститься workflow "Deploy to GitHub Pages"
3. Дождитесь зеленой галочки (обычно 2-3 минуты)

### Шаг 4: Откройте сайт!

Ваш сайт будет доступен по адресу:
**https://impislat.github.io/Crm/**

---

## Важно!

- Каждый раз когда вы пушите изменения в ветку `main` - сайт будет автоматически обновляться
- Данные сохраняются в LocalStorage браузера пользователя
- Используйте кнопки Экспорт/Импорт для бэкапа данных

---

## Если что-то не работает:

1. Проверьте что в настройках GitHub Pages выбран источник **"GitHub Actions"**
2. Проверьте статус деплоя во вкладке Actions
3. Убедитесь что все файлы закоммичены и запушены

Готово! 🎉
