import { decode } from 'base64-arraybuffer';

export interface RichTextNode {
  type: 'paragraph' | 'heading' | 'list' | 'list-item' | 'image' | 'audio' | 'blockquote' | 'code' | 'link';
  content?: string;
  children?: RichTextNode[];
  attrs?: {
    src?: string;
    alt?: string;
    title?: string;
    href?: string;
    target?: string;
    rel?: string;
    duration?: number;
    width?: number;
    height?: number;
  };
}

/**
 * Convert rich text HTML to structured JSON
 */
export const htmlToJson = (html: string): RichTextNode[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  return Array.from(body.children).map(node => parseNode(node));
};

/**
 * Parse a DOM node to our RichTextNode structure
 */
const parseNode = (node: Element): RichTextNode => {
  switch (node.tagName.toLowerCase()) {
    case 'P':
      return {
        type: 'paragraph',
        content: node.textContent || '',
        children: node.childNodes.length > 1
          ? Array.from(node.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE).map(parseNode)
          : undefined,
      };

    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      return {
        type: 'heading',
        content: node.textContent || '',
        attrs: {
          level: parseInt(node.tagName.substring(1)),
        },
        children: Array.from(node.childNodes).map(parseNode),
      };

    case 'UL':
      return {
        type: 'list',
        attrs: {
          ordered: false,
        },
        children: Array.from(node.children).map(parseNode),
      };

    case 'OL':
      return {
        type: 'list',
        attrs: {
          ordered: true,
        },
        children: Array.from(node.children).map(parseNode),
      };

    case 'LI':
      return {
        type: 'list-item',
        content: node.textContent || '',
        children: Array.from(node.childNodes).map(parseNode),
      };

    case 'IMG':
      return {
        type: 'image',
        attrs: {
          src: node.getAttribute('src') || '',
          alt: node.getAttribute('alt') || '',
          title: node.getAttribute('title') || '',
          width: parseInt(node.getAttribute('width') || '0'),
          height: parseInt(node.getAttribute('height') || '0'),
        },
      };

    case 'AUDIO':
      return {
        type: 'audio',
        attrs: {
          src: node.getAttribute('src') || '',
          title: node.getAttribute('title') || '',
          duration: parseFloat(node.getAttribute('data-duration') || '0'),
        },
      };

    case 'BLOCKQUOTE':
      return {
        type: 'blockquote',
        content: node.textContent || '',
        children: Array.from(node.childNodes).map(parseNode),
      };

    case 'PRE':
    case 'CODE':
      return {
        type: 'code',
        content: node.textContent || '',
        attrs: {
          language: node.getAttribute('data-language') || '',
        },
      };

    case 'A':
      return {
        type: 'link',
        content: node.textContent || '',
        attrs: {
          href: node.getAttribute('href') || '',
          target: node.getAttribute('target') || '_blank',
          rel: node.getAttribute('rel') || '',
        },
      };

    default:
      // For unknown elements, treat as paragraph
      return {
        type: 'paragraph',
        content: node.textContent || '',
        children: Array.from(node.childNodes).map(parseNode),
      };
  }
};

/**
 * Convert structured JSON to HTML
 */
export const jsonToHtml = (nodes: RichTextNode[]): string => {
  return nodes.map(node => renderNode(node)).join('');
};

/**
 * Render a RichTextNode to HTML
 */
const renderNode = (node: RichTextNode): string => {
  switch (node.type) {
    case 'paragraph':
      if (node.children && node.children.length > 0) {
        return `<p>${node.children.map(renderNode).join('')}</p>`;
      }
      return `<p>${escapeHtml(node.content || '')}</p>`;

    case 'heading':
      const level = node.attrs?.level || 1;
      const headingTag = `h${level}`;
      if (node.children && node.children.length > 0) {
        return `<${headingTag}>${node.children.map(renderNode).join('')}</${headingTag}>`;
      }
      return `<${headingTag}>${escapeHtml(node.content || '')}</${headingTag}>`;

    case 'list':
      const listTag = node.attrs?.ordered ? 'ol' : 'ul';
      const listItems = node.children?.map(child => renderNode(child)).join('') || '';
      return `<${listTag}>${listItems}</${listTag}>`;

    case 'list-item':
      if (node.children && node.children.length > 0) {
        return `<li>${node.children.map(renderNode).join('')}</li>`;
      }
      return `<li>${escapeHtml(node.content || '')}</li>`;

    case 'image':
      return `<img src="${escapeHtml(node.attrs?.src || '')}"
        alt="${escapeHtml(node.attrs?.alt || '')}"
        title="${escapeHtml(node.attrs?.title || '')}"
        ${node.attrs?.width ? `width="${node.attrs.width}"` : ''}
        ${node.attrs?.height ? `height="${node.attrs.height}"` : ''}
        style="max-width: 100%; height: auto; margin: 10px 0;" />`;

    case 'audio':
      return renderAudioNode(node);

    case 'blockquote':
      if (node.children && node.children.length > 0) {
        return `<blockquote>${node.children.map(renderNode).join('')}</blockquote>`;
      }
      return `<blockquote>${escapeHtml(node.content || '')}</blockquote>`;

    case 'code':
      const language = node.attrs?.language || '';
      return `<pre data-language="${escapeHtml(language)}"><code>${escapeHtml(node.content || '')}</code></pre>`;

    case 'link':
      return `<a href="${escapeHtml(node.attrs?.href || '')}"
        target="${escapeHtml(node.attrs?.target || '_blank')}"
        rel="${escapeHtml(node.attrs?.rel || '')}">${escapeHtml(node.content || '')}</a>`;

    default:
      return escapeHtml(node.content || '');
  }
};

/**
 * Render audio player HTML
 */
const renderAudioNode = (node: RichTextNode): string => {
  const src = node.attrs?.src || '';
  const title = node.attrs?.title || 'Voice Note';
  const duration = node.attrs?.duration || 0;

  const audioHtml = `
    <div class="audio-player" data-duration="${duration}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center;">
          <button onclick="togglePlayPause(this)" style="background: #007AFF; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 8px;">
            <ion-icon name="play"></ion-icon>
          </button>
          <span style="font-size: 14px; color: #333;">${title}</span>
        </div>
        <span class="duration" style="font-size: 12px; color: #666;">${formatDuration(duration)}</span>
      </div>

      <div class="waveform" style="background: #f0f0f0; height: 40px; border-radius: 4px; margin-bottom: 8px;">
        <!-- Waveform visualization would go here -->
      </div>

      <div class="progress" style="height: 2px; background: #ddd; border-radius: 1px; overflow: hidden;">
        <div class="progress-bar" style="height: 100%; background: #007AFF; width: 0%; transition: width 0.1s;"></div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 4px;">
        <span class="current-time" style="font-size: 11px; color: #666;">0:00</span>
        <div style="display: flex; gap: 8px;">
          <button onclick="changeSpeed(this)" style="background: none; border: none; color: #666; font-size: 11px;">
            1x
          </button>
          <button onclick="changeSpeed(this)" style="background: none; border: none; color: #666; font-size: 11px;">
            1.25x
          </button>
          <button onclick="changeSpeed(this)" style="background: none; border: none; color: #666; font-size: 11px;">
            1.5x
          </button>
          <button onclick="changeSpeed(this)" style="background: none; border: none; color: #666; font-size: 11px;">
            2x
          </button>
        </div>
      </div>
    </div>
  `;

  return audioHtml;
};

/**
 * Format duration in seconds to MM:SS format
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

/**
 * Insert image into editor
 */
export const insertImage = async (
  imageUri: string,
  publicUrl: string,
  alt?: string,
  title?: string
): Promise<string> => {
  const imgHtml = `<img src="${publicUrl}" alt="${alt || ''}" title="${title || ''}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
  return imgHtml;
};

/**
 * Insert audio into editor
 */
export const insertAudio = async (
  audioUrl: string,
  duration: number = 0,
  title?: string
): Promise<string> => {
  const audioNode: RichTextNode = {
    type: 'audio',
    attrs: {
      src: audioUrl,
      title: title || 'Voice Note',
      duration,
    },
  };
  return renderNode(audioNode);
};

/**
 * Format text using document.execCommand equivalents
 */
export const formatText = (
  command: string,
  value?: string,
  selection?: string
): { html: string; selection: string } => {
  // This would be executed in the WebView's context
  // Here we return the commands that should be executed
  return {
    html: `<div contenteditable="true">${selection || ''}</div>`,
    selection: '',
  };
};

/**
 * Convert rich text to plain text
 */
export const toPlainText = (nodes: RichTextNode[]): string => {
  return nodes.map(node => {
    switch (node.type) {
      case 'heading':
        return `${'#'.repeat(node.attrs?.level || 1)} ${node.content}\n\n`;
      case 'list-item':
        return `- ${node.content}\n`;
      case 'blockquote':
        return `> ${node.content}\n\n`;
      case 'code':
        return `\`\`\`\n${node.content}\n\`\`\`\n\n`;
      case 'link':
        return node.content;
      case 'image':
        return `[Image: ${node.attrs?.alt || ''}]\n`;
      case 'audio':
        return `[Audio: ${node.attrs?.title || ''}]\n`;
      default:
        return `${node.content}\n`;
    }
  }).join('');
};

/**
 * Convert rich text to Markdown
 */
export const toMarkdown = (nodes: RichTextNode[]): string => {
  return nodes.map(node => {
    switch (node.type) {
      case 'paragraph':
        return `${node.content}\n\n`;
      case 'heading':
        const level = node.attrs?.level || 1;
        return `${'#'.repeat(level)} ${node.content}\n\n`;
      case 'list':
        const isOrdered = node.attrs?.ordered || false;
        const marker = isOrdered ? '1.' : '-';
        const listItems = node.children?.map(child => {
          if (child.type === 'list-item') {
            return `${marker} ${child.content}`;
          }
          return '';
        }).join('\n') || '';
        return `${listItems}\n\n`;
      case 'blockquote':
        return `> ${node.content}\n\n`;
      case 'code':
        const language = node.attrs?.language || '';
        return `\`\`\`${language}\n${node.content}\n\`\`\`\n\n`;
      case 'link':
        return `[${node.content}](${node.attrs?.href || ''})`;
      case 'image':
        return `![${node.attrs?.alt || ''}](${node.attrs?.src || ''})`;
      case 'audio':
        return `[Audio: ${node.attrs?.title || ''}](${node.attrs?.src || ''})`;
      default:
        return node.content || '';
    }
  }).join('');
};

/**
 * Serialize rich text to base64 for storage
 */
export const serialize = (nodes: RichTextNode[]): string => {
  const json = JSON.stringify(nodes);
  return btoa(json);
};

/**
 * Deserialize rich text from base64
 */
export const deserialize = (serialized: string): RichTextNode[] => {
  try {
    const json = atob(serialized);
    return JSON.parse(json);
  } catch (error) {
    console.error('Error deserializing rich text:', error);
    return [];
  }
};

/**
 * Validate rich text structure
 */
export const validate = (nodes: RichTextNode[]): boolean => {
  if (!Array.isArray(nodes)) return false;

  return nodes.every(node => {
    if (!node.type || !['paragraph', 'heading', 'list', 'list-item', 'image', 'audio', 'blockquote', 'code', 'link'].includes(node.type)) {
      return false;
    }

    if (node.children && !validate(node.children)) {
      return false;
    }

    return true;
  });
};

/**
 * Optimize rich text for storage (remove unnecessary data)
 */
export const optimize = (nodes: RichTextNode[]): RichTextNode[] => {
  return nodes.map(node => {
    const optimized: RichTextNode = { type: node.type };

    if (node.attrs) {
      optimized.attrs = {};

      // Only keep relevant attributes based on type
      switch (node.type) {
        case 'image':
          optimized.attrs.src = node.attrs.src;
          optimized.attrs.alt = node.attrs.alt;
          optimized.attrs.title = node.attrs.title;
          break;
        case 'audio':
          optimized.attrs.src = node.attrs.src;
          optimized.attrs.title = node.attrs.title;
          optimized.attrs.duration = node.attrs.duration;
          break;
        case 'link':
          optimized.attrs.href = node.attrs.href;
          optimized.attrs.target = node.attrs.target;
          break;
        case 'heading':
          optimized.attrs.level = node.attrs.level;
          break;
        case 'code':
          optimized.attrs.language = node.attrs.language;
          break;
      }
    }

    if (node.content) {
      optimized.content = node.content.trim();
    }

    if (node.children) {
      optimized.children = optimize(node.children);
    }

    return optimized;
  }).filter(node => {
    // Filter out empty nodes
    if (node.type === 'paragraph' && !node.content && (!node.children || node.children.length === 0)) {
      return false;
    }
    return true;
  });
};