import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Story, Chapter } from './types';

export type ExportFormat = 'pdf' | 'markdown' | 'text';
export type Theme = 'romance' | 'fantasy' | 'our_future';

const THEME_INFO: Record<Theme, { label: string; emoji: string }> = {
  romance: { label: 'Romance', emoji: '💕' },
  fantasy: { label: 'Fantasy', emoji: '🐉' },
  our_future: { label: 'Our Future', emoji: '🌟' },
};

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeInspiration: boolean;
}

export async function exportStory(
  story: Story,
  chapters: Chapter[],
  inspirations: string[],
  options: ExportOptions
): Promise<void> {
  const content = generateStoryContent(story, chapters, inspirations, options);

  const fileName = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}_export`;
  const fileUri = FileSystem.documentDirectory + `${fileName}.${getFileExtension(options.format)}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: getMimeType(options.format),
        dialogTitle: `Exported: ${story.title}`,
      });
    } else {
      console.error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export story');
  }
}

function generateStoryContent(
  story: Story,
  chapters: Chapter[],
  inspirations: string[],
  options: ExportFormat
): string {
  const { format, includeMetadata, includeInspiration } = options;
  const theme = THEME_INFO[story.theme];

  let content = '';

  if (format === 'markdown') {
    content += '# ' + story.title + '\n\n';

    if (includeMetadata) {
      content += `**Theme:** ${theme.label} ${theme.emoji}\n`;
      content += `**Created:** ${new Date(story.created_at).toLocaleDateString()}\n\n`;
      content += '---\n\n';
    }

    content += '## Story\n\n';
    chapters.forEach((chapter, index) => {
      content += `### Chapter ${chapter.chapter_number}\n\n`;
      content += chapter.content + '\n\n';
    });

    if (includeInspiration && inspirations.length > 0) {
      content += '## Inspirations\n\n';
      inspirations.forEach(inspiration => {
        content += `- ${inspiration}\n`;
      });
      content += '\n';
    }

    content += '\n---\n';
    content += `Exported from Parallel Story Builder\n`;

  } else if (format === 'text') {
    content += story.title + '\n';
    content += '='.repeat(story.title.length) + '\n\n';

    if (includeMetadata) {
      content += `Theme: ${theme.label} ${theme.emoji}\n`;
      content += `Created: ${new Date(story.created_at).toLocaleDateString()}\n\n`;
      content += '---\n\n';
    }

    content += 'Story:\n\n';
    chapters.forEach((chapter, index) => {
      content += `Chapter ${chapter.chapter_number}\n`;
      content += '-'.repeat(15) + '\n\n';
      content += chapter.content + '\n\n';
    });

    if (includeInspiration && inspirations.length > 0) {
      content += 'Inspirations:\n\n';
      inspirations.forEach(inspiration => {
        content += `• ${inspiration}\n`;
      });
      content += '\n';
    }

    content += '\n---\n';
    content += `Exported from Parallel Story Builder\n`;

  } else if (format === 'pdf') {
    content = generateHTMLContent(story, chapters, inspirations, options);
  }

  return content;
}

function generateHTMLContent(
  story: Story,
  chapters: Chapter[],
  inspirations: string[],
  options: ExportOptions
): string {
  const { includeMetadata, includeInspiration } = options;
  const theme = THEME_INFO[story.theme];

  const themeColors: Record<Theme, { primary: string; bg: string }> = {
    romance: { primary: '#E91E63', bg: '#FCE4EC' },
    fantasy: { primary: '#9C27B0', bg: '#F3E5F5' },
    our_future: { primary: '#2196F3', bg: '#E3F2FD' },
  };

  const colors = themeColors[story.theme];

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
            background-color: ${colors.bg};
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .title {
            color: ${colors.primary};
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        .theme-emoji {
            font-size: 2rem;
        }
        .metadata {
            background: ${colors.bg};
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        .chapter {
            margin-bottom: 2rem;
        }
        .chapter-title {
            color: ${colors.primary};
            font-size: 1.5rem;
            margin-bottom: 1rem;
            border-bottom: 2px solid ${colors.primary};
            padding-bottom: 0.5rem;
        }
        .inspirations {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 2rem;
        }
        .inspirations h3 {
            color: ${colors.primary};
            margin-top: 0;
        }
        .inspiration-item {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        .inspiration-item:before {
            content: "💡";
            position: absolute;
            left: 0;
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 0.9rem;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${story.title}</h1>
            <div class="theme-emoji">${theme.emoji}</div>
        </div>

        ${includeMetadata ? `
        <div class="metadata">
            <p><strong>Theme:</strong> ${theme.label}</p>
            <p><strong>Created:</strong> ${new Date(story.created_at).toLocaleDateString()}</p>
        </div>
        ` : ''}

        <div class="story-content">
            ${chapters.map((chapter, index) => `
            <div class="chapter">
                <h2 class="chapter-title">Chapter ${chapter.chapter_number}</h2>
                <p>${chapter.content.replace(/\n/g, '</p><p>')}</p>
            </div>
            `).join('')}
        </div>

        ${includeInspiration && inspirations.length > 0 ? `
        <div class="inspirations">
            <h3>Inspirations</h3>
            ${inspirations.map(inspiration => `
            <div class="inspiration-item">${inspiration}</div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Exported from Parallel Story Builder</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'html';
    case 'markdown':
      return 'md';
    case 'text':
      return 'txt';
    default:
      return 'txt';
  }
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'text/html';
    case 'markdown':
      return 'text/markdown';
    case 'text':
      return 'text/plain';
    default:
      return 'text/plain';
  }
}

export async function previewExportContent(
  story: Story,
  chapters: Chapter[],
  inspirations: string[],
  options: ExportOptions
): Promise<string> {
  return generateStoryContent(story, chapters, inspirations, options);
}