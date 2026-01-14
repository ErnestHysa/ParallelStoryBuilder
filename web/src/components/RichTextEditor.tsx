'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

// Custom Image extension with better handling
const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },
});

const MenuBar = ({
  editor,
  onImageInsert,
  selectedImage,
  onDeleteImage
}: {
  editor: any;
  onImageInsert?: (file: File) => void;
  selectedImage: boolean;
  onDeleteImage: () => void;
}) => {
  if (!editor || !editor.isEditable) return null;

  type ToolbarButton = {
    icon: any;
    command: string;
    title: string;
    getActive: () => boolean;
    args?: Record<string, unknown>;
  };

  const toolbarGroups: ToolbarButton[][] = [
    // History
    [
      { icon: Undo, command: 'undo', title: 'Undo', getActive: () => false },
      { icon: Redo, command: 'redo', title: 'Redo', getActive: () => false },
    ],
    // Headings
    [
      { icon: Heading1, command: 'toggleHeading', args: { level: 1 }, title: 'Heading 1', getActive: () => editor.isActive('heading', { level: 1 }) },
      { icon: Heading2, command: 'toggleHeading', args: { level: 2 }, title: 'Heading 2', getActive: () => editor.isActive('heading', { level: 2 }) },
    ],
    // Text formatting
    [
      { icon: Bold, command: 'toggleBold', title: 'Bold', getActive: () => editor.isActive('bold') },
      { icon: Italic, command: 'toggleItalic', title: 'Italic', getActive: () => editor.isActive('italic') },
      { icon: UnderlineIcon, command: 'toggleUnderline', title: 'Underline', getActive: () => editor.isActive('underline') },
    ],
    // Lists
    [
      { icon: List, command: 'toggleBulletList', title: 'Bullet List', getActive: () => editor.isActive('bulletList') },
      { icon: ListOrdered, command: 'toggleOrderedList', title: 'Numbered List', getActive: () => editor.isActive('orderedList') },
    ],
    // Insert
    [
      { icon: Quote, command: 'toggleBlockquote', title: 'Quote', getActive: () => editor.isActive('blockquote') },
      { icon: Code, command: 'toggleCodeBlock', title: 'Code Block', getActive: () => editor.isActive('codeBlock') },
      { icon: LinkIcon, command: 'setLink', title: 'Link', getActive: () => editor.isActive('link') },
    ],
  ];

  const handleImageClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageInsert) {
        onImageInsert(file);
      }
    };
    input.click();
  }, [onImageInsert]);

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-cream-100 dark:bg-dark-bgTertiary rounded-t-xl border-b border-cream-300 dark:border-dark-border">
      {toolbarGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex gap-1 mr-2">
          {group.map((button) => {
            const isActive = button.getActive();
            return (
              <button
                key={button.title}
                onClick={() => {
                  if (button.command === 'setLink') {
                    const url = window.prompt('Enter URL:');
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  } else if (button.args) {
                    editor.chain().focus()[button.command](button.args).run();
                  } else {
                    editor.chain().focus()[button.command]().run();
                  }
                }}
                className={cn(
                  'p-2 rounded transition-colors',
                  'hover:bg-rose-100 dark:hover:bg-rose-900/30',
                  isActive
                    ? 'bg-rose-200 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300'
                    : 'text-ink-600 dark:text-dark-textSecondary'
                )}
                title={button.title}
              >
                <button.icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      ))}

      <div className="w-px bg-cream-300 dark:bg-dark-border mx-1" />

      {/* Image button */}
      <button
        onClick={handleImageClick}
        className={cn(
          'p-2 rounded transition-colors',
          'hover:bg-rose-100 dark:hover:bg-rose-900/30',
          selectedImage
            ? 'bg-rose-200 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300'
            : 'text-ink-600 dark:text-dark-textSecondary'
        )}
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* Delete image button - only shows when image is selected */}
      {selectedImage && (
        <>
          <div className="w-px bg-cream-300 dark:bg-dark-border mx-1" />
          <button
            onClick={onDeleteImage}
            className="p-2 rounded transition-colors bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            title="Delete Image (Backspace)"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

// Helper to compress image as base64
const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
  });
};

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Begin writing your chapter here... Let your imagination flow freely.',
  editable = true,
  className,
}: RichTextEditorProps) {
  const [selectedImage, setSelectedImage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-rose-500 dark:text-rose-400 underline hover:text-rose-600 dark:hover:text-rose-300',
        },
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rich-text-image max-w-full h-auto rounded-lg my-4 cursor-pointer transition-all hover:opacity-90',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Check if an image is selected
      const { from, to } = editor.state.selection;
      const doc = editor.state.doc;
      let hasImageSelected = false;

      if (from !== to) {
        // Check if selection contains an image
        editor.state.doc.nodesBetween(from, to, (node) => {
          if (node.type.name === 'image') {
            hasImageSelected = true;
            return false; // Stop iteration
          }
        });
      } else {
        // Check if cursor is on an image node
        const node = doc.nodeAt(from);
        if (node?.type.name === 'image') {
          hasImageSelected = true;
        }
      }

      setSelectedImage(hasImageSelected);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg max-w-none focus:outline-none min-h-[50vh] px-8 py-6',
          'prose-headings:font-display prose-headings:text-ink-950 dark:prose-headings:text-dark-text',
          'prose-p:text-ink-800 dark:prose-p:text-dark-textSecondary prose-p:leading-relaxed',
          'prose-strong:text-ink-950 dark:prose-strong:text-dark-text prose-strong:font-semibold',
          'prose-em:text-ink-800 dark:prose-em:text-dark-textSecondary',
          'prose-a:text-rose-500 dark:prose-a:text-rose-400 prose-a:no-underline hover:prose-a:underline',
          'prose-blockquote:border-l-4 prose-blockquote:border-rose-300 dark:prose-blockquote:border-rose-700 prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-code:bg-cream-200 dark:prose-code:bg-dark-bgTertiary prose-code:px-1 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-dark-bg prose-pre:text-dark-text',
          'prose-ul:list-disc prose-ol:list-decimal',
          'is-editor-empty:before:content-[attr(data-placeholder)] before:text-ink-400 dark:before:text-dark-textMuted before:float-left before:h-0 before:pointer-events-none'
        ),
      },
      handleKeyDown: (view, event) => {
        // Handle Delete/Backspace when image is selected
        if (event.key === 'Delete' || event.key === 'Backspace') {
          const { state } = view;
          const { selection } = state;
          const { from, to } = selection;

          // Check if cursor is on an image
          if (from === to) {
            const node = state.doc.nodeAt(from);
            if (node?.type.name === 'image') {
              const tr = state.tr.delete(from, from + node.nodeSize);
              view.dispatch(tr);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Update editor content when content prop changes (but not during initialization)
  useEffect(() => {
    if (editor && isInitialized && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor, isInitialized]);

  // Mark editor as initialized after mount
  useEffect(() => {
    if (editor && !isInitialized) {
      setIsInitialized(true);
    }
  }, [editor, isInitialized]);

  const handleImageInsert = useCallback(
    async (file: File) => {
      if (!editor) return;

      try {
        // Compress image first
        const compressedSrc = await compressImage(file, 800, 0.8);

        // Insert image at cursor position without replacing text
        editor.chain().focus().insertContent([
          {
            type: 'image',
            attrs: { src: compressedSrc }
          },
          {
            type: 'paragraph',
          }
        ]).run();
      } catch (error) {
        console.error('Error inserting image:', error);
        // Fallback to basic insert
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      }
    },
    [editor]
  );

  const handleDeleteImage = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
    setSelectedImage(false);
  }, [editor]);

  return (
    <div className={cn('bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft overflow-hidden', className)}>
      {editable && (
        <MenuBar
          editor={editor}
          onImageInsert={handleImageInsert}
          selectedImage={selectedImage}
          onDeleteImage={handleDeleteImage}
        />
      )}
      <EditorContent editor={editor} />

      {/* Image selection hint */}
      {selectedImage && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span>Image selected - Press Delete/Backspace or click X to remove</span>
        </div>
      )}
    </div>
  );
}
