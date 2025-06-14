interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          context?: 'use' | 'signin' | 'signup';
          ux_mode?: 'popup' | 'redirect';
          prompt_parent_id?: string;
          flow?: 'implicit' | 'auth-code';
          scope?: string;
          locale?: string;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number;
            locale?: string;
          }
        ) => void;
        prompt: () => void;
      };
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token: string }) => void;
          error_callback?: (error: { type: string; message: string }) => void;
        }) => {
          requestAccessToken: (overridableConfig?: {
            prompt?: '' | 'none' | 'consent' | 'select_account';
            enable_serial_consent?: boolean;
            hint?: string;
          }) => void;
        };
      };
    };
  };
  gapi: {
    load: (
      api: string,
      options: {
        callback?: () => void;
        onerror?: (error: any) => void;
        timeout?: number;
        ontimeout?: () => void;
      }
    ) => void;
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
    auth2: {
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        signOut: () => void;
      };
    };
    signin2: {
      render: (
        element: string | HTMLElement,
        options: {
          scope: string;
          width: number;
          height: number;
          longtitle: boolean;
          theme: string;
          onsuccess: () => void;
          onfailure: (error: any) => void;
        }
      ) => void;
    };
  };
} 