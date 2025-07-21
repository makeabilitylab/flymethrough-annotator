# FlyMeThrough Annotator

A professional video annotation tool for research and development, powered by SAM2 (Segment Anything Model 2) for intelligent object segmentation and tracking.

## Overview

FlyMeThrough is a React-based web application that enables researchers to efficiently annotate video sequences with object segmentation masks and bounding boxes. The tool leverages state-of-the-art computer vision models to provide semi-automated annotation capabilities, significantly reducing the time and effort required for video annotation tasks.

## Features

- **Intelligent Segmentation**: Utilizes SAM2 (Segment Anything Model 2) for high-quality object segmentation
- **Interactive Annotation**: Point-and-click interface for positive/negative point annotations
- **Real-time Processing**: Live mask generation and refinement as you annotate
- **Multi-frame Tracking**: Automatic propagation of annotations across video frames
- **Video Review Mode**: Playback functionality to review annotations at 2fps
- **Compression-aware**: Supports both compressed and raw frame formats
- **Export Capabilities**: Structured annotation data export for downstream processing
- **Professional UI**: Clean, responsive interface built with DaisyUI and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend video server (see Backend Setup section)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd diam-annotator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Backend Setup

The application requires a backend server that provides:
- Video metadata and frame lists via `GET /videos`
- Compressed frame images at `http://localhost/video_images_compressed/{video_name}/{frame}`
- Raw frame images at `http://localhost/video_images_raw/{video_name}/{frame}`
- Annotation processing endpoint at `/process` for SAM2 inference

## Main Functions

### 1. Video Selection
- Browse available videos from the backend
- Preview video thumbnails
- Select video for annotation

### 2. Interactive Annotation
- **Point Annotation**: Click to add positive (foreground) or negative (background) points
- **Real-time Segmentation**: SAM2 generates masks instantly based on point inputs
- **Mask Refinement**: Add additional points to improve segmentation quality
- **Annotation Confirmation**: Save annotations with descriptive labels

### 3. Multi-frame Navigation
- **Frame Navigation**: Use arrow keys or frame panel to navigate through video
- **Annotation Propagation**: Backend processes annotations across multiple frames
- **Bounding Box Visualization**: View automatically generated bounding boxes

### 4. Review and Validation
- **Review Mode**: Automatic playback through annotated frames
- **Statistics Display**: View annotation count and processing times
- **Quality Control**: Visual verification of annotation accuracy

## Code Structure

### Frontend Architecture

```
src/
├── Components/
│   ├── Annotation.tsx              # Core annotation data model
│   ├── Video.tsx                   # Video data management class
│   ├── AnnotationInterface/        # Annotation UI components
│   │   ├── AnnotationPanel.tsx     # Main annotation canvas
│   │   ├── AnnotationResultsPanel.tsx # Results display
│   │   ├── AnnotationToolsPanel.tsx   # Annotation tools
│   │   └── FramesPanel.tsx         # Frame navigation
│   ├── SelectionInterface/         # Video selection components
│   │   ├── VideoCard.tsx           # Individual video preview
│   │   └── VideoList.tsx           # Video grid display
│   └── SAM/                        # SAM2 model integration
│       ├── encoder.tsx             # SAM2 encoder wrapper
│       ├── decoder.tsx             # SAM2 decoder/predictor
│       └── mask.tsx                # Mask processing utilities
├── Pages/
│   ├── SelectionPage.tsx           # Video selection page
│   └── AnnotationPage.tsx          # Main annotation interface
├── App.tsx                         # Root application component
└── index.tsx                       # Application entry point
```

### Key Components

#### `Annotation` Class
- Manages individual annotation instances
- Handles point collections, masks, and bounding boxes
- Provides validation and data export functionality

#### `Video` Class
- Centralized video data management
- Frame navigation and URL generation
- Annotation collection and SAM encoding storage

#### `AnnotationPage`
- Main annotation interface orchestration
- State management for annotation workflow
- Integration with SAM2 models and backend processing

#### SAM2 Integration
- **Encoder**: Processes frame images to generate embeddings
- **Decoder/Predictor**: Generates masks from embeddings and point prompts
- **Mask Processing**: Handles mask visualization and data compression

### Data Flow

1. **Video Loading**: Backend provides video metadata and frame lists
2. **Frame Processing**: SAM2 encoder generates frame embeddings
3. **User Interaction**: Point clicks trigger SAM2 decoder for mask generation
4. **Annotation Storage**: Masks and metadata stored in Video/Annotation objects
5. **Backend Processing**: Compressed annotation data sent for multi-frame processing
6. **Results Integration**: Backend returns bounding boxes integrated into video data

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive interfaces
- **React Router**: Client-side routing for navigation
- **Konva/React-Konva**: Canvas-based graphics for annotation visualization
- **Axios**: HTTP client for backend communication
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Tailwind CSS component library

### AI/ML
- **ONNX Runtime Web**: Client-side model inference
- **SAM2**: Segment Anything Model 2 for object segmentation

### Build Tools
- **Create React App**: Development and build toolchain
- **PostCSS**: CSS processing and optimization

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Document all public methods with JSDoc comments
- Follow React functional component patterns
- Implement proper error handling and validation
- Use meaningful variable and function names

### Component Organization
- Separate concerns between data models and UI components
- Use React hooks for state management
- Implement proper cleanup for event listeners and intervals
- Follow single responsibility principle

### Performance Considerations
- Optimize SAM2 model loading and inference
- Implement efficient frame caching strategies
- Use appropriate data structures for large annotation datasets
- Minimize re-renders through proper state management

## Available Scripts

- `npm start`: Development server with hot reload
- `npm test`: Run test suite
- `npm run build`: Production build
- `npm run eject`: Eject from Create React App (irreversible)

## API Integration

### Video Endpoint
```http
GET /videos
```
Returns array of video objects with name, image_count, and frame metadata.

### Processing Endpoint
```http
POST /process
```
Accepts compressed annotation data and returns multi-frame bounding box results.

## Contributing

1. Follow the established code structure and patterns
2. Add comprehensive documentation for new features
3. Test annotation workflows thoroughly
4. Ensure backend compatibility for new functionality
5. Update README documentation for significant changes

## License

This project is designed for research and development purposes. Please ensure appropriate licensing for production use.

## Troubleshooting

### Common Issues
- **Model Loading**: Ensure ONNX model files are accessible in the public directory
- **Backend Connection**: Verify backend server is running and accessible
- **CORS Issues**: Configure backend to allow cross-origin requests
- **Memory Usage**: Large videos may require chunked processing for performance

### Performance Tips
- Use compressed frames for display, raw frames for processing
- Limit concurrent SAM2 inference operations
- Implement frame preloading for smoother navigation
- Monitor memory usage during long annotation sessions