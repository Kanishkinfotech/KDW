import React, { useState } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Eye, Monitor, Tablet, Smartphone,
  Layout, AlignLeft, List, Image as ImageIcon, Video, MousePointerClick, 
  HelpCircle, Code, DollarSign, Quote, Heading as HeadingIcon, Type
} from 'lucide-react';

export interface ContentBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  text?: string;
  level?: number;
  items?: string[];
  imageUrl?: string;
  videoUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  price?: string;
  code?: string;
  language?: string;
  features?: string[];
  [key: string]: any;
}

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  readOnly?: boolean;
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'Section Heading', icon: HeadingIcon, desc: 'H2 or H3 heading for section separation' },
  { type: 'paragraph', label: 'Paragraph Text', icon: Type, desc: 'Regular text paragraphs and explanations' },
  { type: 'checklist', label: 'Checklist / Key Points', icon: List, desc: 'Interactive bulleted list of highlights or steps' },
  { type: 'quote', label: 'Callout Quote', icon: Quote, desc: 'Highlighted italic quote or key principle' },
  { type: 'code', label: 'Code Snippet', icon: Code, desc: 'Syntax-styled code block with language label' },
  { type: 'imageText', label: 'Image + Caption', icon: ImageIcon, desc: 'Image banner with explanatory caption' },
  { type: 'cta', label: 'Call to Action', icon: MousePointerClick, desc: 'Prominent prompt box with action link' },
  { type: 'hero', label: 'Hero Header', icon: Layout, desc: 'Prominent banner header with title and subtitle' }
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks = [], onChange, readOnly = false }) => {
  const [activePreview, setActivePreview] = useState<'edit' | 'desktop' | 'tablet' | 'mobile'>('edit');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addBlock = (type: string) => {
    let newBlock: ContentBlock;
    const baseId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    switch (type) {
      case 'heading':
        newBlock = {
          id: baseId,
          type: 'heading',
          text: 'Section Title',
          title: 'Section Title',
          level: 2
        };
        break;
      case 'paragraph':
      case 'text':
        newBlock = {
          id: baseId,
          type: 'paragraph',
          text: 'Enter paragraph content here...',
          content: 'Enter paragraph content here...'
        };
        break;
      case 'checklist':
      case 'featureList':
        newBlock = {
          id: baseId,
          type: 'checklist',
          title: 'Key Takeaways',
          items: ['Principle 1: Deterministic design', 'Principle 2: Instant verification', 'Principle 3: Production ready'],
          features: ['Principle 1: Deterministic design', 'Principle 2: Instant verification', 'Principle 3: Production ready']
        };
        break;
      case 'quote':
        newBlock = {
          id: baseId,
          type: 'quote',
          text: 'Simplicity and determinism are the foundations of craftsmanship.',
          content: 'Simplicity and determinism are the foundations of craftsmanship.',
          subtitle: 'KDW Principles'
        };
        break;
      case 'code':
        newBlock = {
          id: baseId,
          type: 'code',
          language: 'typescript',
          code: '// Example code snippet\nexport const runWorkflow = async () => {\n  console.log("Automating pipeline...");\n};',
          content: '// Example code snippet\nexport const runWorkflow = async () => {\n  console.log("Automating pipeline...");\n};'
        };
        break;
      case 'imageText':
        newBlock = {
          id: baseId,
          type: 'imageText',
          imageUrl: '',
          text: 'Image caption description',
          content: 'Image caption description'
        };
        break;
      case 'cta':
        newBlock = {
          id: baseId,
          type: 'cta',
          title: 'Ready to streamline your systems?',
          ctaLabel: 'Explore Products',
          ctaUrl: '/shop'
        };
        break;
      case 'hero':
      default:
        newBlock = {
          id: baseId,
          type: 'hero',
          title: 'Main Headline',
          subtitle: 'Subheading explanation text'
        };
        break;
    }

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
    const cloned = { ...target, id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
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
            Structured Content Blocks ({blocks.length})
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
            Edit
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
          {blocks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
              No content blocks added yet. Click below to insert your first section.
            </div>
          ) : (
            blocks.map((block, index) => {
              const currentType = block.type || 'paragraph';

              return (
                <div key={block.id || index} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        {currentType}
                      </span>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveBlock(index, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === blocks.length - 1}
                          onClick={() => moveBlock(index, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateBlock(index)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(index)}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Block Field Inputs */}
                  <div className="space-y-3">
                    {/* HEADING BLOCK */}
                    {currentType === 'heading' && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Heading Text</label>
                          <input
                            type="text"
                            placeholder="e.g. 01. Context & Executive Summary"
                            value={block.text || block.title || ''}
                            onChange={e => updateBlock(index, { text: e.target.value, title: e.target.value })}
                            className="w-full text-base font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Level</label>
                          <select
                            value={block.level || 2}
                            onChange={e => updateBlock(index, { level: parseInt(e.target.value, 10) || 2 })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                          >
                            <option value={2}>H2 - Major Section</option>
                            <option value={3}>H3 - Subsection</option>
                            <option value={4}>H4 - Minor Point</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* PARAGRAPH / TEXT BLOCK */}
                    {(currentType === 'paragraph' || currentType === 'text') && (
                      <div className="space-y-2">
                        {currentType === 'text' && (
                          <input
                            type="text"
                            placeholder="Optional Section Heading"
                            value={block.title || ''}
                            onChange={e => updateBlock(index, { title: e.target.value })}
                            className="w-full text-sm font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        )}
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Paragraph Content</label>
                        <textarea
                          rows={4}
                          placeholder="Enter paragraph text..."
                          value={block.text || block.content || ''}
                          onChange={e => updateBlock(index, { text: e.target.value, content: e.target.value })}
                          className="w-full text-sm leading-relaxed px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* CHECKLIST / FEATURE LIST BLOCK */}
                    {(currentType === 'checklist' || currentType === 'featureList') && (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Checklist Title (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Implementation Checklist"
                            value={block.title || ''}
                            onChange={e => updateBlock(index, { title: e.target.value })}
                            className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-600">List Items</label>
                          {(block.items || block.features || []).map((item: string, itemIdx: number) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-50 text-[#5b21b6] text-xs font-bold flex items-center justify-center shrink-0">
                                ✓
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={e => {
                                  const currentItems = [...(block.items || block.features || [])];
                                  currentItems[itemIdx] = e.target.value;
                                  updateBlock(index, { items: currentItems, features: currentItems });
                                }}
                                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentItems = (block.items || block.features || []).filter((_: any, i: number) => i !== itemIdx);
                                  updateBlock(index, { items: currentItems, features: currentItems });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const currentItems = [...(block.items || block.features || []), 'New guideline / checkpoint'];
                              updateBlock(index, { items: currentItems, features: currentItems });
                            }}
                            className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Checklist Item
                          </button>
                        </div>
                      </div>
                    )}

                    {/* QUOTE BLOCK */}
                    {currentType === 'quote' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Quote Text</label>
                        <textarea
                          rows={2}
                          placeholder="Inspirational principle or takeaway..."
                          value={block.text || block.content || ''}
                          onChange={e => updateBlock(index, { text: e.target.value, content: e.target.value })}
                          className="w-full text-sm italic px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Attribution / Subtitle (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. KDW Engineering Principles"
                            value={block.subtitle || ''}
                            onChange={e => updateBlock(index, { subtitle: e.target.value })}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* CODE BLOCK */}
                    {currentType === 'code' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600">Code Snippet</label>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Language:</span>
                            <input
                              type="text"
                              value={block.language || 'typescript'}
                              onChange={e => updateBlock(index, { language: e.target.value })}
                              placeholder="typescript"
                              className="text-xs px-2 py-1 border border-slate-200 rounded-md font-mono w-28"
                            />
                          </div>
                        </div>
                        <textarea
                          rows={4}
                          placeholder="// Paste code snippet here..."
                          value={block.code || block.content || ''}
                          onChange={e => updateBlock(index, { code: e.target.value, content: e.target.value })}
                          className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* IMAGE + TEXT BLOCK */}
                    {currentType === 'imageText' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Image URL</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={block.imageUrl || ''}
                          onChange={e => updateBlock(index, { imageUrl: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                        />
                        {block.imageUrl && (
                          <div className="max-h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                            <img src={block.imageUrl} alt="Preview" className="w-full h-full object-cover max-h-36" />
                          </div>
                        )}
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Caption / Description</label>
                        <textarea
                          rows={2}
                          placeholder="Accompanying explanation text..."
                          value={block.content || block.text || ''}
                          onChange={e => updateBlock(index, { content: e.target.value, text: e.target.value })}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    )}

                    {/* HERO BLOCK */}
                    {currentType === 'hero' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Hero Title</label>
                        <input
                          type="text"
                          placeholder="Hero Headline"
                          value={block.title || block.text || ''}
                          onChange={e => updateBlock(index, { title: e.target.value, text: e.target.value })}
                          className="w-full text-base font-bold px-3 py-2 border border-slate-200 rounded-xl"
                        />
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Hero Subtitle</label>
                        <input
                          type="text"
                          placeholder="Subheading description..."
                          value={block.subtitle || ''}
                          onChange={e => updateBlock(index, { subtitle: e.target.value })}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    )}

                    {/* CTA BLOCK */}
                    {currentType === 'cta' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Call to Action Heading</label>
                          <input
                            type="text"
                            placeholder="Heading"
                            value={block.title || ''}
                            onChange={e => updateBlock(index, { title: e.target.value })}
                            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Label</label>
                          <input
                            type="text"
                            placeholder="Button Label"
                            value={block.ctaLabel || ''}
                            onChange={e => updateBlock(index, { ctaLabel: e.target.value })}
                            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Destination URL</label>
                          <input
                            type="text"
                            placeholder="/shop or /products/..."
                            value={block.ctaUrl || ''}
                            onChange={e => updateBlock(index, { ctaUrl: e.target.value })}
                            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

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
                      className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {BLOCK_TYPES.map(bt => {
                      const Icon = bt.icon;
                      return (
                        <button
                          key={bt.type}
                          type="button"
                          onClick={() => addBlock(bt.type)}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 text-left transition-all group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{bt.label}</span>
                            <span className="text-[10px] text-slate-400 block leading-tight">{bt.desc}</span>
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
                  className="w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-all bg-white hover:bg-blue-50/20 cursor-pointer"
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
            className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
              activePreview === 'desktop'
                ? 'w-full max-w-4xl p-8'
                : activePreview === 'tablet'
                ? 'w-[768px] p-6'
                : 'w-[375px] p-4'
            }`}
          >
            <div className="space-y-6">
              {blocks.map((b, i) => (
                <div key={i} className="space-y-3">
                  {b.type === 'hero' && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl p-6">
                      <h1 className="text-2xl font-black text-slate-900">{b.title || b.text}</h1>
                      {b.subtitle && <p className="text-sm text-slate-600 mt-2">{b.subtitle}</p>}
                    </div>
                  )}
                  {b.type === 'heading' && (
                    <h2 className="text-2xl font-serif font-bold text-[#171325] pt-2">
                      {b.text || b.title}
                    </h2>
                  )}
                  {(b.type === 'paragraph' || b.type === 'text') && (
                    <div className="space-y-1">
                      {b.title && <h3 className="text-base font-bold text-slate-900">{b.title}</h3>}
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{b.text || b.content}</p>
                    </div>
                  )}
                  {(b.type === 'checklist' || b.type === 'featureList') && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2.5">
                      {b.title && <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{b.title}</h4>}
                      <ul className="space-y-1.5">
                        {(b.items || b.features || []).map((f: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#ede9fe] text-[#5b21b6] font-bold text-[10px] flex items-center justify-center shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {b.type === 'quote' && (
                    <blockquote className="border-l-4 border-[#5b21b6] pl-4 py-2 my-4 text-base italic text-slate-900 bg-[#ede9fe]/20 rounded-r-xl">
                      "{b.text || b.content}"
                      {b.subtitle && <div className="text-xs font-sans not-italic text-slate-500 mt-1">— {b.subtitle}</div>}
                    </blockquote>
                  )}
                  {b.type === 'code' && (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                      <code>{b.code || b.content}</code>
                    </pre>
                  )}
                  {b.type === 'imageText' && (
                    <div className="space-y-2">
                      {b.imageUrl && (
                        <img src={b.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-60" />
                      )}
                      {(b.content || b.text) && (
                        <p className="text-xs text-slate-500 italic">{b.content || b.text}</p>
                      )}
                    </div>
                  )}
                  {b.type === 'cta' && (
                    <div className="text-center py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-4 space-y-2">
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
