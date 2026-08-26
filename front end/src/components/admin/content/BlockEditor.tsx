import React, { useState } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Eye, Monitor, Tablet, Smartphone,
  Layout, AlignLeft, List, Image as ImageIcon, Video, MousePointerClick, 
  HelpCircle, Code, DollarSign
} from 'lucide-react';

export interface ContentBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  price?: string;
  code?: string;
  language?: string;
  features?: string[];
}

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  readOnly?: boolean;
}

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Header', icon: Layout, desc: 'Large banner header with title and subtitle' },
  { type: 'text', label: 'Text Section', icon: AlignLeft, desc: 'Heading with paragraph content' },
  { type: 'featureList', label: 'Feature Checklist', icon: List, desc: 'Bulleted key highlights or capabilities' },
  { type: 'imageText', label: 'Image + Text', icon: ImageIcon, desc: 'Side-by-side media and explanatory copy' },
  { type: 'cta', label: 'Call to Action', icon: MousePointerClick, desc: 'Action prompt with button link' },
  { type: 'productCard', label: 'Product Showcase', icon: DollarSign, desc: 'Direct link to buy product or bundle' },
  { type: 'faq', label: 'FAQ Accordion', icon: HelpCircle, desc: 'Question and detailed answer block' },
  { type: 'video', label: 'Video Embed', icon: Video, desc: 'Embedded Loom, YouTube or MP4 video' },
  { type: 'code', label: 'Code Snippet', icon: Code, desc: 'Formatted syntax-highlighted code block' }
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks = [], onChange, readOnly = false }) => {
  const [activePreview, setActivePreview] = useState<'edit' | 'desktop' | 'tablet' | 'mobile'>('edit');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: type === 'hero' ? 'Main Headline' : type === 'text' ? 'Section Heading' : '',
      subtitle: type === 'hero' ? 'Subheading description text' : '',
      content: type === 'text' ? 'Enter detailed content here...' : '',
      features: type === 'featureList' ? ['Feature 1: Instant access', 'Feature 2: Commercial licence', 'Feature 3: Lifetime updates'] : [],
      ctaLabel: type === 'cta' ? 'Get Started Now' : '',
      ctaUrl: type === 'cta' ? '/products' : ''
    };
    onChange([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const duplicateBlock = (index: number) => {
    const target = blocks[index];
    const cloned = { ...target, id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
    const next = [...blocks];
    next.splice(index + 1, 0, cloned);
    onChange(next);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Editor Controls Bar */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Structured Block Editor ({blocks.length} blocks)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActivePreview('edit')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activePreview === 'edit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActivePreview('desktop')}
            className={`p-1.5 rounded-md transition-all ${
              activePreview === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Desktop Preview"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActivePreview('tablet')}
            className={`p-1.5 rounded-md transition-all ${
              activePreview === 'tablet' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Tablet Preview"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActivePreview('mobile')}
            className={`p-1.5 rounded-md transition-all ${
              activePreview === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Mobile Preview"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Mode */}
      {activePreview === 'edit' ? (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id || index} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {block.type}
                  </span>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateBlock(index)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(index)}
                      className="p-1 text-rose-400 hover:text-rose-600"
                      title="Delete Block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Block Field Inputs */}
              <div className="space-y-3">
                {block.type === 'hero' && (
                  <>
                    <input
                      type="text"
                      placeholder="Hero Title"
                      value={block.title || ''}
                      onChange={e => updateBlock(index, { title: e.target.value })}
                      className="w-full text-base font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="Hero Subtitle / Description"
                      value={block.subtitle || ''}
                      onChange={e => updateBlock(index, { subtitle: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </>
                )}

                {block.type === 'text' && (
                  <>
                    <input
                      type="text"
                      placeholder="Section Heading"
                      value={block.title || ''}
                      onChange={e => updateBlock(index, { title: e.target.value })}
                      className="w-full text-sm font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <textarea
                      rows={4}
                      placeholder="Paragraph content..."
                      value={block.content || ''}
                      onChange={e => updateBlock(index, { content: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </>
                )}

                {block.type === 'featureList' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Feature List Title"
                      value={block.title || ''}
                      onChange={e => updateBlock(index, { title: e.target.value })}
                      className="w-full text-sm font-semibold px-3 py-2 border border-slate-200 rounded-xl"
                    />
                    <div className="space-y-1.5">
                      {(block.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={e => {
                              const newFeatures = [...(block.features || [])];
                              newFeatures[fIdx] = e.target.value;
                              updateBlock(index, { features: newFeatures });
                            }}
                            className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFeatures = (block.features || []).filter((_, i) => i !== fIdx);
                              updateBlock(index, { features: newFeatures });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateBlock(index, { features: [...(block.features || []), 'New feature point'] })}
                        className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Feature Item
                      </button>
                    </div>
                  </div>
                )}

                {block.type === 'cta' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="CTA Heading"
                      value={block.title || ''}
                      onChange={e => updateBlock(index, { title: e.target.value })}
                      className="text-sm px-3 py-2 border border-slate-200 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Button Label"
                      value={block.ctaLabel || ''}
                      onChange={e => updateBlock(index, { ctaLabel: e.target.value })}
                      className="text-sm px-3 py-2 border border-slate-200 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Destination URL (e.g. /products)"
                      value={block.ctaUrl || ''}
                      onChange={e => updateBlock(index, { ctaUrl: e.target.value })}
                      className="text-sm px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}

                {block.type === 'imageText' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={block.imageUrl || ''}
                      onChange={e => updateBlock(index, { imageUrl: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                    />
                    <textarea
                      rows={2}
                      placeholder="Accompanying explanation text..."
                      value={block.content || ''}
                      onChange={e => updateBlock(index, { content: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Block Selector */}
          {!readOnly && (
            <div className="pt-2">
              {showAddMenu ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Content Block to Insert</span>
                    <button
                      type="button"
                      onClick={() => setShowAddMenu(false)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {BLOCK_TYPES.map(bt => {
                      const Icon = bt.icon;
                      return (
                        <button
                          key={bt.type}
                          type="button"
                          onClick={() => addBlock(bt.type)}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 text-left transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{bt.label}</span>
                            <span className="text-[11px] text-slate-400 block leading-tight">{bt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddMenu(true)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-all bg-white hover:bg-blue-50/20"
                >
                  <Plus className="w-4 h-4" /> Add Structured Block
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Responsive Preview Frame */
        <div className="flex justify-center p-6 bg-slate-100 rounded-2xl border border-slate-200">
          <div
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
              activePreview === 'desktop'
                ? 'w-full max-w-4xl p-8'
                : activePreview === 'tablet'
                ? 'w-[768px] p-6'
                : 'w-[375px] p-4'
            }`}
          >
            <div className="space-y-8">
              {blocks.map((b, i) => (
                <div key={i} className="space-y-3">
                  {b.type === 'hero' && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl p-6">
                      <h1 className="text-2xl font-black text-slate-900">{b.title}</h1>
                      {b.subtitle && <p className="text-sm text-slate-600 mt-2">{b.subtitle}</p>}
                    </div>
                  )}
                  {b.type === 'text' && (
                    <div className="space-y-2">
                      {b.title && <h2 className="text-lg font-bold text-slate-900">{b.title}</h2>}
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{b.content}</p>
                    </div>
                  )}
                  {b.type === 'featureList' && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                      {b.title && <h3 className="text-sm font-bold text-slate-800">{b.title}</h3>}
                      <ul className="space-y-1">
                        {(b.features || []).map((f, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {b.type === 'cta' && (
                    <div className="text-center py-6 bg-blue-600 text-white rounded-xl p-4 space-y-2">
                      <h3 className="text-base font-bold">{b.title || 'Ready to get started?'}</h3>
                      <button className="px-4 py-2 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm">
                        {b.ctaLabel || 'Action'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
