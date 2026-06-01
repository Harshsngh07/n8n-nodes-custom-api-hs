import type {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IHttpRequestOptions,
    IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class CustomApi implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Custom API',
        name: 'customApi',
        icon: { light: 'file:../../icons/custom.svg', dark: 'file:../../icons/custom.dark.svg' },
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["method"] + " " + $parameter["path"]}}',
        description: 'Call your own REST API endpoints',
        defaults: {
            name: 'Custom API',
        },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        usableAsTool: true,
        credentials: [
            {
                name: 'customApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Method',
                name: 'method',
                type: 'options',
                options: [
                    { name: 'DELETE', value: 'DELETE' },
                    { name: 'GET', value: 'GET' },
                    { name: 'PATCH', value: 'PATCH' },
                    { name: 'POST', value: 'POST' },
                    { name: 'PUT', value: 'PUT' },
                ],
                default: 'GET',
                description: 'HTTP method used for the request',
            },
            {
                displayName: 'Path',
                name: 'path',
                type: 'string',
                default: '/v1/resource',
                placeholder: '/v1/users',
                description: 'API path starting with /',
            },
            {
                displayName: 'Query Parameters',
                name: 'query',
                type: 'json',
                default: '{}',
                description: 'Optional query object as JSON',
            },
            {
                displayName: 'Body',
                name: 'body',
                type: 'json',
                default: '{}',
                description: 'Optional request body as JSON',
                displayOptions: {
                    show: {
                        method: ['POST', 'PUT', 'PATCH'],
                    },
                },
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const method = this.getNodeParameter('method', itemIndex) as IHttpRequestMethods;
                const path = this.getNodeParameter('path', itemIndex) as string;
                const query = this.getNodeParameter('query', itemIndex, {}) as IDataObject;
                const body = this.getNodeParameter('body', itemIndex, {}) as IDataObject;
                const credentials = await this.getCredentials('customApi');
                const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
                const normalizedPath = path.startsWith('/') ? path : `/${path}`;

                const options: IHttpRequestOptions = {
                    method,
                    url: `${baseUrl}${normalizedPath}`,
                    qs: query,
                    json: true,
                };

                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    options.body = body;
                }

                const responseData = await this.helpers.httpRequestWithAuthentication.call(
                    this,
                    'customApi',
                    options,
                );

                const json =
                    typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)
                        ? (responseData as IDataObject)
                        : ({ data: responseData } as IDataObject);

                returnData.push({ json, pairedItem: { item: itemIndex } });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: this.getInputData(itemIndex)[0].json,
                        error,
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }

                throw new NodeOperationError(this.getNode(), error, { itemIndex });
            }
        }

        return [returnData];
    }
}
