/*
  ГЛАВНЫЙ ФАЙЛ, КОТОРЫЙ ТЫ БУДЕШЬ МЕНЯТЬ САМА.

  В каждой книге:
  - id        = короткое имя для ссылки ?book=...
  - title     = название на сайте
  - targetSrc = файл .mind, в котором собраны страницы этой книги
  - scenes    = соответствие "какая страница -> какое видео"

  targetIndex начинается с 0 и должен совпадать с порядком картинок
  при создании targets.mind.
*/

window.AR_BOOKS = [
  {
    id: "dino",
    title: "Долина динозавров",
    subtitle: "Тестовая книга",
    targetSrc: "./books/dino/targets.mind",

    scenes: [
      {
        targetIndex: 0,
        name: "Динозавры — страница 1",

        // Положи сюда своё видео и назови его dino-01.mp4
        video: "./books/dino/videos/dino-01.mp4",

        // Для горизонтального разворота A4 примерно 1 : 0.707
        width: 1,
        height: 0.707,

        // true = видео может иметь прозрачность (например WebM с alpha)
        transparent: false
      }

      /*
      Следующая оживающая страница будет выглядеть так:

      ,{
        targetIndex: 1,
        name: "Динозавры — страница 2",
        video: "./books/dino/videos/dino-02.mp4",
        width: 1,
        height: 0.707,
        transparent: false
      }
      */
    ]
  }

  /*
  НОВАЯ КНИГА — просто копируешь блок выше:

  ,{
    id: "ocean",
    title: "Океан идей",
    subtitle: "Подводная история",
    targetSrc: "./books/ocean/targets.mind",
    scenes: [
      {
        targetIndex: 0,
        name: "Океан — страница 1",
        video: "./books/ocean/videos/ocean-01.mp4",
        width: 1,
        height: 0.707,
        transparent: false
      }
    ]
  }
  */
];
