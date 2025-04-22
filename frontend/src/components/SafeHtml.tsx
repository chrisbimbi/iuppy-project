// src/components/SafeHtml.tsx

import React from 'react';
import { sanitizeHtml } from '../utils/sanitizeHtml';

interface SafeHtmlProps {
  html: string;
}

const SafeHtml: React.FC<SafeHtmlProps> = ({ html }) => {
  const sanitizedHtml = sanitizeHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

export default SafeHtml;