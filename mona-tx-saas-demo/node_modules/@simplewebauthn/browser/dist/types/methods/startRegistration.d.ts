import { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/types';
export declare function startRegistration(creationOptionsJSON: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON>;
