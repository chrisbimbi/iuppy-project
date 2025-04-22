// src/components/QuillWrapper.tsx

import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillWrapperProps {
  value: string;
  onChange: (content: string) => void;
  height?: string; 
}

const QuillWrapper: React.FC<QuillWrapperProps> = ({ value, onChange, height = '400px' }) => {
  
  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']                                         // remove formatting button
    ],
  };

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
    <div style={{ height: height }}>
      <ReactQuill 
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