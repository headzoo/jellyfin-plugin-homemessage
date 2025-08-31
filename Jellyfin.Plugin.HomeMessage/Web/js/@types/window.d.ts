declare global {
  interface Window {
    ApiClient: {
      getUrl: (path: string) => string;
      getJSON: <T = unknown>(url: string) => Promise<T>;
      ajax: (options: AjaxOptions) => Promise<AjaxResponse>;
    };
  }
}

export {};
