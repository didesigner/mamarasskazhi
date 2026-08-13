(() => {
  const homeScreen = document.getElementById("homeScreen");
  const introScreen = document.getElementById("introScreen");
  const arScreen = document.getElementById("arScreen");
  const errorScreen = document.getElementById("errorScreen");

  const bookList = document.getElementById("bookList");
  const bookTitle = document.getElementById("bookTitle");
  const bookHint = document.getElementById("bookHint");
  const arTitle = document.getElementById("arTitle");
  const statusText = document.getElementById("statusText");
  const errorText = document.getElementById("errorText");

  const startButton = document.getElementById("startButton");
  const backButton = document.getElementById("backButton");
  const closeButton = document.getElementById("closeButton");
  const retryButton = document.getElementById("retryButton");
  const errorHomeButton = document.getElementById("errorHomeButton");

  const arMount = document.getElementById("arMount");

  let currentBook = null;
  let sceneEl = null;
  let mindarSystem = null;

  const books = Array.isArray(window.AR_BOOKS) ? window.AR_BOOKS : [];

  function showOnly(screen) {
    [homeScreen, introScreen, arScreen, errorScreen].forEach(el => el.classList.add("hidden"));
    screen.classList.remove("hidden");
  }

  function getBookFromUrl() {
    const id = new URLSearchParams(location.search).get("book");
    if (!id) return null;
    return books.find(b => b.id === id) || null;
  }

  function renderBookList() {
    bookList.innerHTML = "";

    if (!books.length) {
      bookList.innerHTML = "<p>Пока книги не добавлены.</p>";
      return;
    }

    books.forEach(book => {
      const btn = document.createElement("button");
      btn.className = "book-button";
      btn.innerHTML = `${escapeHtml(book.title)}<small>${escapeHtml(book.subtitle || "")}</small>`;
      btn.addEventListener("click", () => selectBook(book));
      bookList.appendChild(btn);
    });
  }

  function selectBook(book) {
    currentBook = book;
    bookTitle.textContent = book.title;
    arTitle.textContent = book.title;
    bookHint.textContent = "Нажми кнопку, разреши доступ к камере и наведи телефон на оживающую страницу.";
    showOnly(introScreen);

    const url = new URL(location.href);
    url.searchParams.set("book", book.id);
    history.replaceState({}, "", url);
  }

  function goHome() {
    stopAR();
    currentBook = null;

    const url = new URL(location.href);
    url.searchParams.delete("book");
    history.replaceState({}, "", url);

    showOnly(homeScreen);
  }

  async function startAR() {
    if (!currentBook) return goHome();

    if (!window.AFRAME) {
      return showError("Не загрузилась AR-библиотека A-Frame. Проверь интернет и обнови страницу.");
    }

    showOnly(arScreen);
    statusText.textContent = "Запускаю камеру…";

    try {
      buildARScene(currentBook);

      await waitForSceneLoaded(sceneEl);

      mindarSystem = sceneEl.systems["mindar-image-system"];
      if (!mindarSystem) {
        throw new Error("MindAR system not found");
      }

      // На iPhone видео лучше "разблокировать" пользовательским нажатием.
      unlockAllVideos();

      await mindarSystem.start();
      statusText.textContent = "Наведи камеру на страницу книги";
    } catch (err) {
      console.error(err);
      stopAR();

      let msg = "Не удалось запустить AR.";
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        msg = "Камера работает только через HTTPS. На GitHub Pages HTTPS включается автоматически.";
      } else {
        msg += " Проверь доступ к камере и наличие файла targets.mind для выбранной книги.";
      }
      showError(msg);
    }
  }

  function buildARScene(book) {
    arMount.innerHTML = "";

    const scene = document.createElement("a-scene");
    sceneEl = scene;

    scene.setAttribute("embedded", "");
    scene.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${book.targetSrc}; autoStart: false; uiLoading: no; uiScanning: no; uiError: no;`
    );
    scene.setAttribute("color-space", "sRGB");
    scene.setAttribute("renderer", "colorManagement: true; physicallyCorrectLights: false; alpha: true;");
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");

    const assets = document.createElement("a-assets");
    assets.setAttribute("timeout", "20000");

    for (const item of book.scenes) {
      const video = document.createElement("video");
      video.id = videoId(book.id, item.targetIndex);
      video.src = item.video;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("preload", "auto");
      video.setAttribute("crossorigin", "anonymous");
      assets.appendChild(video);
    }

    scene.appendChild(assets);

    for (const item of book.scenes) {
      const target = document.createElement("a-entity");
      target.setAttribute("mindar-image-target", `targetIndex: ${item.targetIndex}`);

      const videoPlane = document.createElement("a-video");
      videoPlane.setAttribute("src", `#${videoId(book.id, item.targetIndex)}`);
      videoPlane.setAttribute("position", "0 0 0.01");
      videoPlane.setAttribute("rotation", "0 0 0");
      videoPlane.setAttribute("width", String(item.width ?? 1));
      videoPlane.setAttribute("height", String(item.height ?? 0.707));
      videoPlane.setAttribute(
        "material",
        `shader: flat; transparent: ${item.transparent ? "true" : "false"}; side: double;`
      );

      target.appendChild(videoPlane);
      scene.appendChild(target);

      target.addEventListener("targetFound", () => {
        const video = document.getElementById(videoId(book.id, item.targetIndex));
        statusText.textContent = item.name || "Страница ожила ✨";
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      });

      target.addEventListener("targetLost", () => {
        const video = document.getElementById(videoId(book.id, item.targetIndex));
        if (video) video.pause();
        statusText.textContent = "Наведи камеру на страницу книги";
      });
    }

    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");
    scene.appendChild(camera);

    arMount.appendChild(scene);
  }

  function unlockAllVideos() {
    if (!currentBook) return;
    currentBook.scenes.forEach(item => {
      const video = document.getElementById(videoId(currentBook.id, item.targetIndex));
      if (!video) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
      }
    });
  }

  function stopAR() {
    try {
      if (mindarSystem) mindarSystem.stop();
    } catch (e) {
      console.warn(e);
    }

    if (currentBook) {
      currentBook.scenes.forEach(item => {
        const video = document.getElementById(videoId(currentBook.id, item.targetIndex));
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      });
    }

    mindarSystem = null;
    sceneEl = null;
    arMount.innerHTML = "";
  }

  function showError(message) {
    errorText.textContent = message;
    showOnly(errorScreen);
  }

  function waitForSceneLoaded(scene) {
    return new Promise((resolve, reject) => {
      if (!scene) return reject(new Error("No scene"));
      if (scene.hasLoaded) return resolve();

      const timer = setTimeout(() => reject(new Error("Scene load timeout")), 20000);
      scene.addEventListener("loaded", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

  function videoId(bookId, index) {
    return `video-${bookId}-${index}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  startButton.addEventListener("click", startAR);
  backButton.addEventListener("click", goHome);
  closeButton.addEventListener("click", () => {
    stopAR();
    showOnly(introScreen);
  });
  retryButton.addEventListener("click", startAR);
  errorHomeButton.addEventListener("click", goHome);

  window.addEventListener("pagehide", stopAR);

  renderBookList();

  const initialBook = getBookFromUrl();
  if (initialBook) {
    currentBook = initialBook;
    bookTitle.textContent = initialBook.title;
    arTitle.textContent = initialBook.title;
    showOnly(introScreen);
  } else {
    showOnly(homeScreen);
  }
})();
