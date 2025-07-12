import { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
export declare function startAuthentication(requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON, useBrowserAutofill?: boolean): Promise<AuthenticationResponseJSON>;
