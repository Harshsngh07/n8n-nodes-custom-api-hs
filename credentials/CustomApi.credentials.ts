import type {
    IAuthenticateGeneric,
    Icon,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class CustomApi implements ICredentialType {
    name = 'customApi';

    displayName = 'Custom API';

    icon: Icon = { light: 'file:../icons/custom.svg', dark: 'file:../icons/custom.dark.svg' };

    documentationUrl = 'https://docs.example.com';

    properties: INodeProperties[] = [
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://api.example.com',
            placeholder: 'https://api.yourcompany.com',
            description: 'Root URL for the API',
        },
        {
            displayName: 'Test Endpoint',
            name: 'testEndpoint',
            type: 'string',
            default: '/',
            placeholder: '/health',
            description: 'Path appended to the Base URL when clicking Test (GET request)',
        },
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description: 'API key used as a bearer token',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}',
            url: '={{$credentials.testEndpoint || "/"}}',
            method: 'GET',
        },
    };
}
