/**
 * Video Processor
 * Processes video files with transcription and frame analysis
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, VideoData, ExtractedImage } from '@/types/files';
import { generateId } from '@/lib/utils/id';

export class VideoProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['mp4', 'avi', 'mov', 'mkv', 'webm'];
  }

  async validate(file: File): Promise<boolean> {
    return file.type.startsWith('video/');
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Extract metadata
      const metadata = await this.extractVideoMetadata(file);

      // Extract key frames
      const keyFrames = await this.extractKeyFrames(file, 10);

      // Extract audio and transcribe if enabled
      let transcription;
      if (options.enableTranscription) {
        try {
          transcription = await this.extractAndTranscribeAudio(file);
        } catch (error) {
          console.warn('[VideoProcessor] Transcription failed:', error);
        }
      }

      const videoData: VideoData = {
        keyFrames,
        transcription,
      };

      return {
        textContent: transcription?.text || '',
        videoData,
        metadata,
        images: keyFrames,
      };
    } catch (error) {
      console.error('[VideoProcessor] Processing failed:', error);
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractVideoMetadata(file: File): Promise<any> {
    try {
      // Use Video element to extract basic metadata
      if (typeof HTMLVideoElement === 'undefined') {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }

      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const metadata = {
            name: file.name,
            size: file.size,
            type: file.type,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            aspectRatio: video.videoWidth / video.videoHeight,
          };

          URL.revokeObjectURL(url);
          resolve(metadata);
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
          });
        };

        video.src = url;
      });
    } catch (error) {
      console.error('[VideoProcessor] Metadata extraction failed:', error);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }
  }

  private async extractKeyFrames(file: File, frameCount: number): Promise<ExtractedImage[]> {
    try {
      if (typeof HTMLVideoElement === 'undefined' || typeof document === 'undefined') {
        return [];
      }

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return [];
      }

      const url = URL.createObjectURL(file);
      video.src = url;

      return new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          const frames: ExtractedImage[] = [];
          const duration = video.duration;
          const interval = duration / frameCount;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          for (let i = 0; i < frameCount; i++) {
            const time = i * interval;

            try {
              await this.seekToTime(video, time);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              frames.push({
                id: generateId(),
                src: imageDataUrl,
                width: canvas.width,
                height: canvas.height,
                format: 'jpeg',
                caption: `Frame at ${time.toFixed(2)}s`,
              });
            } catch (error) {
              console.warn(`[VideoProcessor] Failed to extract frame at ${time}s:`, error);
            }
          }

          URL.revokeObjectURL(url);
          resolve(frames);
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve([]);
        };
      });
    } catch (error) {
      console.error('[VideoProcessor] Key frame extraction failed:', error);
      return [];
    }
  }

  private async seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };

      const onError = () => {
        video.removeEventListener('error', onError);
        reject(new Error('Seek failed'));
      };

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);

      video.currentTime = time;

      // Timeout after 5 seconds
      setTimeout(() => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        reject(new Error('Seek timeout'));
      }, 5000);
    });
  }

  private async extractAndTranscribeAudio(file: File): Promise<any> {
    try {
      // In production, you would:
      // 1. Extract audio track from video using FFmpeg
      // 2. Convert to supported format
      // 3. Send to Whisper API

      // For now, we'll return a placeholder
      // Note: This would require server-side processing with FFmpeg

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn('[VideoProcessor] OpenAI API key not configured');
        return {
          text: '[Transcription not available - API key not configured]',
          duration: 0,
          language: 'en',
          confidence: 0,
        };
      }

      // In a real implementation:
      // 1. Extract audio: ffmpeg -i video.mp4 -vn -acodec libmp3lame audio.mp3
      // 2. Send to Whisper API (same as AudioProcessor)

      return {
        text: '[Video transcription requires server-side processing]',
        duration: 0,
        language: 'en',
        confidence: 0,
      };
    } catch (error) {
      console.error('[VideoProcessor] Audio transcription failed:', error);
      throw error;
    }
  }
}
