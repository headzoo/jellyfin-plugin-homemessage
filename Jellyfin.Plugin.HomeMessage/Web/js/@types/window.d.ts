declare global {
  interface Window {
    ApiClient: {
      getUrl: (path: string) => string;
      getJSON: <T = unknown>(url: string) => Promise<T>;
      ajax: (options: AjaxOptions) => Promise<AjaxResponse>;
      getPluginConfiguration: (pluginId: string) => Promise<any>;
      updatePluginConfiguration: (pluginId: string, config: any) => Promise<any>;
    };

    Dashboard: {
      alert: (options: any) => void;
      capabilities: (host: string) => any;
      confirm: (message: string, title: string, callback: (result: boolean) => void) => void;
      getPluginUrl: (name: string) => string;
      getConfigurationResourceUrl: (name: string) => string;
      getCurrentUser: () => any;
      getCurrentUserId: () => string;
      hideLoadingMsg: () => void;
      logout: () => void;
      navigate: (url: string, preserveQueryString: boolean) => void;
      onServerChanged: (_userId: string, _accessToken: string, apiClient: any) => void;
      processErrorResponse: (response: any) => void;
      processPluginConfigurationUpdateResult: (result: any) => void;
      processServerConfigurationUpdateResult: () => void;
      selectServer: () => void;
      serverAddress: () => string;
      showLoadingMsg: () => void;
      datetime: any;
      DirectoryBrowser: any;
      dialogHelper: any;
      itemIdentifier: any;
      setBackdropTransparency: any;
    };
  }
}

export {};
