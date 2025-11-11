/**
 * Audio Processor
 * Processes audio files with transcription capabilities
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, AudioData, TranscriptionResult } from '@/types/files';
import { generateId } from '@/lib/utils/id';

export class AudioProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'];
  }

  async validate(file: File): Promise<boolean> {
    return file.type.startsWith('audio/');
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Extract metadata
      const metadata = await this.extractAudioMetadata(file);

      // Transcribe audio if enabled
      let audioData: AudioData | undefined;
      if (options.enableTranscription) {
        try {
          const transcription = await this.transcribeAudio(file);
          audioData = { transcription };
        } catch (error) {
          console.warn('[AudioProcessor] Transcription failed:', error);
        }
      }

      // Extract waveform data
      try {
        const waveform = await this.extractWaveform(file);
        if (audioData) {
          audioData.waveform = waveform;
        } else {
          audioData = { waveform };
        }
      } catch (error) {
        console.warn('[AudioProcessor] Waveform extraction failed:', error);
      }

      return {
        textContent: audioData?.transcription?.text || '',
        audioData,
        metadata,
      };
    } catch (error) {
      console.error('[AudioProcessor] Processing failed:', error);
      throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractAudioMetadata(file: File): Promise<any> {
    // In production, you'd use a library like music-metadata
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      duration: 0, // Would be extracted from actual audio
      format: file.type.split('/')[1],
    };
  }

  private async transcribeAudio(file: File): Promise<TranscriptionResult> {
    try {
      // Use OpenAI Whisper API for transcription
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn('[AudioProcessor] OpenAI API key not configured');
        return {
          text: '[Transcription not available - API key not configured]',
          duration: 0,
          language: 'en',
          confidence: 0,
        };
      }

      // Convert to supported format if needed
      const audioBlob = await this.convertToSupportedFormat(file);

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription API error: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        text: result.text,
        duration: result.duration || 0,
        language: result.language || 'en',
        confidence: result.segments?.reduce((acc: number, seg: any) => acc + (seg.avg_logprob || 0), 0) / (result.segments?.length || 1) || 0,
        segments: result.segments?.map((seg: any) => ({
          text: seg.text,
          start: seg.start,
          end: seg.end,
          confidence: seg.avg_logprob,
        })),
        words: result.words?.map((word: any) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.probability,
        })),
      };
    } catch (error) {
      console.error('[AudioProcessor] Transcription failed:', error);
      throw error;
    }
  }

  private async convertToSupportedFormat(file: File): Promise<Blob> {
    // If already MP3 or WAV, return as is
    if (file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.type === 'audio/wav') {
      return file;
    }

    // In production, you'd use FFmpeg or similar to convert
    // For now, we'll just return the original file
    return file;
  }

  private async extractWaveform(file: File): Promise<number[]> {
    try {
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        return [];
      }

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Extract channel data
      const channelData = audioBuffer.getChannelData(0);

      // Downsample to ~1000 points
      const samples = 1000;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;

        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }

        waveform.push(sum / blockSize);
      }

      return waveform;
    } catch (error) {
      console.error('[AudioProcessor] Waveform extraction failed:', error);
      return [];
    }
  }
}
