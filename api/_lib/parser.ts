import { IncomingMessage } from 'http';
import { parse } from 'url';
import { dataTypes, DataTypes, ParsedRequest, RequestParam } from './types';

const validateDataType = (type: RequestParam): type is DataTypes => {
    return dataTypes.includes(type as any);
};
const isValidId = (id: RequestParam): id is string => new RegExp('^[a-fA-F\\d]{16}$').test(id as string);

export function parseRequest(req: IncomingMessage) {
    const { query } = parse(req.url || '/', true);
    const { html, type, id } = (query || {});

    if (!validateDataType(type)) {
        throw new Error(`Invalid type parameter. Valid types are: ${dataTypes.join(', ')}.`);
    }
    if (!isValidId(id)) {
        throw new Error('Invalid player id.');
    }

    const parsedRequest: ParsedRequest = {
        html: html !== undefined,
        type,
        id,
    };
    return parsedRequest;
}
