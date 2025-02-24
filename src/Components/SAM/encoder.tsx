import * as ort from 'onnxruntime-web';
const ENCODER_MODEL_URL = 'https://storage.googleapis.com/lb-artifacts-testing-public/sam2/sam2_hiera_tiny.encoder.ort';
const ENCODER_MODEL_URL_SMALL = '../models/sam2_hiera_small.encoder.with_runtime_opt.ort';
const ENCODER_MODEL_URL_LARGE = '../models/sam2_hiera_large.encoder.with_runtime_opt.ort';
class SAM2Encoder {
    private session: ort.InferenceSession | null;
    private lastEmbeddings: Float32Array | null;

    constructor() {
        this.session = null;
        this.lastEmbeddings = null;
    }

    async initialize() {
        try {
            console.log('Starting to load encoder model...');
            // Create session
            this.session = await ort.InferenceSession.create(ENCODER_MODEL_URL);
            console.log('Encoder session created successfully');
        } catch (e) {
            console.error('Failed to load encoder model:', e);
            throw e;
        }
    }

    async encode(image) {
        try {
            // Prepare input tensor
            const tensor = this.imageDataToTensor(image);

            // Run inference
            const feeds = { image: tensor };
            const results = await this.session.run(feeds);

            // Store the embeddings
            this.lastEmbeddings = results.image_embed;

            return this.lastEmbeddings;
        } catch (e) {
            console.error('Encoding error:', e);
            throw e;
        }
    }

    imageDataToTensor(image) {
        // Get image data directly from the image
        const width = image.width;
        const height = image.height;
        const inputArray = new Float32Array(3 * 1024 * 1024);

        // Create temporary canvas just for reading pixels
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.drawImage(image, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, width, height).data;

        // Calculate scaling factors
        const scaleX = width / 1024;
        const scaleY = height / 1024;

        // Sample pixels using nearest neighbor interpolation
        for (let y = 0; y < 1024; y++) {
            for (let x = 0; x < 1024; x++) {
                const srcX = Math.min(Math.floor(x * scaleX), width - 1);
                const srcY = Math.min(Math.floor(y * scaleY), height - 1);
                const srcIdx = (srcY * width + srcX) * 4;
                const dstIdx = y * 1024 + x;

                // Normalize to [-1, 1] range while copying
                inputArray[dstIdx] = (imageData[srcIdx] / 255.0) * 2 - 1;                    // R
                inputArray[dstIdx + 1024 * 1024] = (imageData[srcIdx + 1] / 255.0) * 2 - 1; // G 
                inputArray[dstIdx + 2 * 1024 * 1024] = (imageData[srcIdx + 2] / 255.0) * 2 - 1; // B
            }
        }

        return new ort.Tensor('float32', inputArray, [1, 3, 1024, 1024]);
    }
}

export default SAM2Encoder;
