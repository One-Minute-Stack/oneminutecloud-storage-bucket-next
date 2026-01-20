type UploadOptions$1 = {
    onProgress?: (progress: {
        loaded: number;
        total: number;
        percent: number;
    }) => void;
};
declare class Storage {
    static upload(file: File, bucketId: string, options?: UploadOptions$1): Promise<{
        key: string;
    }>;
}
declare const storage: typeof Storage;

declare function handleStorageRequest({ request, props, apiKey, }: {
    request: Request;
    props: {
        params: Promise<{
            provider: string;
        }>;
    };
    apiKey: string;
}): Promise<Response>;

type UploadProgress = {
    loaded: number;
    total: number;
    percent: number;
};
type UploadOptions = {
    onProgress?: (progress: UploadProgress) => void;
};

export { type UploadOptions, type UploadProgress, handleStorageRequest, storage };
