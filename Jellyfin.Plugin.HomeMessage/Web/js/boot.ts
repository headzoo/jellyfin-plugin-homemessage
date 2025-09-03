(() => {
  /**
   * Waits for the window.ApiClient object to be available, then calls ready().
   */
  const boot = () => {
    if (!window.ApiClient || !window.ApiClient.getUrl) {
      setTimeout(boot, 100);
      return;
    }

    const url = window.ApiClient.getUrl('HomeMessage/assets/js/build/home.js');
    const s = document.createElement('script');
    s.src = url;
    s.defer = true;
    document.head.appendChild(s);
  };
  boot();
})();
