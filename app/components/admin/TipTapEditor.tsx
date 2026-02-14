import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
} from 'lucide-react';

interface TipTapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Escribe algo...',
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return (
            <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-50 min-h-[180px]" />
        );
    }

    const toggleLink = () => {
        const prevUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', prevUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden focus-within:border-brand-orange focus-within:ring-4 focus-within:ring-brand-orange/5 transition-all bg-white">
            <div className="flex items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-dark hover:bg-white/60'}`}
                    type="button"
                    title="Negrita"
                >
                    <Bold size={15} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-dark hover:bg-white/60'}`}
                    type="button"
                    title="Cursiva"
                >
                    <Italic size={15} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-dark hover:bg-white/60'}`}
                    type="button"
                    title="Subrayado"
                >
                    <UnderlineIcon size={15} />
                </button>

                <div className="w-px h-4 bg-gray-200 mx-1" />

                <button
                    onClick={toggleLink}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-dark hover:bg-white/60'}`}
                    type="button"
                    title="Enlace"
                >
                    <LinkIcon size={15} />
                </button>
            </div>
            <EditorContent
                editor={editor}
                className="[&_.tiptap]:min-h-[160px] [&_.tiptap]:p-4 [&_.tiptap]:text-sm [&_.tiptap]:font-medium [&_.tiptap]:text-dark [&_.tiptap]:outline-none [&_.tiptap_a]:text-brand-orange [&_.tiptap_a]:underline"
            />
            <style dangerouslySetInnerHTML={{
                __html: `
          .tiptap p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `}} />
        </div>
    );
}
