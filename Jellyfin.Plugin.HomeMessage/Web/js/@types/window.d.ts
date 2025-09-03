declare global {
  interface Window {
    ApiClient: {
      getUrl: (path: string) => string;
      getJSON: <T = unknown>(url: string) => Promise<T>;
      ajax: (options: AjaxOptions) => Promise<AjaxResponse>;
      getPluginConfiguration: (pluginId: string) => Promise<any>;
      updatePluginConfiguration: (pluginId: string, config: any) => Promise<any>;
    };

    Dashboard: any;
  }
}

export {};
