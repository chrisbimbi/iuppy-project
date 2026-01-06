import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css'; // Já importado no main.tsx
import imageCompression from 'browser-image-compression';
import { uploadFileToFirebase } from 'src/utils/fileUtils';

// 🔥 FIX: Garante que a imagem seja tratada como Inline para permitir Links
// Acessa Quill de forma segura (algumas versões do react-quill não exportam Quill nomeado)
const Quill = ReactQuill.Quill;
if (Quill) {
  const Image = Quill.import('formats/image') as any;
  Image.className = 'img-fluid';
  Quill.register(Image, true);
}

interface QuillWrapperProps {
  value: string;
  onChange: (content: string) => void;
  height?: string;
  companyId?: string; // ⬅ novo prop
}

const QuillWrapper: React.FC<QuillWrapperProps> = ({ value, onChange, height = '400px', companyId }) => {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = () => {
    if (!companyId) {
      alert('Company ID not found. Cannot upload image.');
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        // 1. Resize/Compress
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // 2. Upload to Firebase
        // Usamos 'attachment' como kind genérico, ou poderia ser 'content-image'
        const { url } = await uploadFileToFirebase(compressedFile, companyId, 'attachment');

        // 3. Insert URL
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          const index = range ? range.index : 0;
          quill.insertEmbed(index, 'image', url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [] }],
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [companyId]); // Recria modules se companyId mudar

  const formats = [
    'font',
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'script',
    'direction',
    'size',
    'color', 'background',
    'align',
    'link', 'image', 'video'
  ];

  return (
    <div style={{ height: height }} className="quill-wrapper-container">
      <ReactQuill
        key={companyId || 'loading'} // 🔥 Força remount se companyId mudar
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{ height: `calc(${height} - 42px)` }}
      />
    </div>
  );
};

export default QuillWrapper;