interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        renderButton: (
          element: HTMLElement,
          options: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: number;
          }
        ) => void;
      };
    };
  };
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (config: {
        apiKey?: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      gmail: {
        users: {
          messages: {
            list: (params: {
              userId: string;
              q: string;
              maxResults: number;
            }) => Promise<{
              result: {
                messages?: Array<{
                  id: string;
                }>;
              };
            }>;
            get: (params: {
              userId: string;
              id: string;
            }) => Promise<{
              result: {
                payload: {
                  headers: Array<{
                    name: string;
                    value: string;
                  }>;
                };
              };
            }>;
          };
        };
      };
    };
  };
} 