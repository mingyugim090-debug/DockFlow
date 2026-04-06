'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Clock, Search, Download, Trash2, FileX } from 'lucide-react';
import { fetchDocuments, deleteDocument, getDownloadUrl, formatFileSize, getFormatLabel, getFormatBadgeColor } from '@/lib/api';
import { DocumentListItem } from '@/lib/types';

const FORMAT_FILTERS = ['전체', 'pptx', 'xlsx', 'pdf', 'contract'];
const FORMAT_LABELS: Record<string, string> = { pptx: 'PPT', xlsx: 'EXCEL', pdf: 'PDF', contract: '계약서' };

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('전체');

  useEffect(() => {
    fetchDocuments(50).then((data) => {
      setDocuments(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = documents.filter((doc) => {
    const matchFormat = filter === '전체' || doc.format === filter;
    const matchSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    return matchFormat && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 문서</h1>
          <p className="text-gray-500 text-sm mt-1">AI가 생성한 모든 문서를 관리하세요.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="문서 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-4 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all w-60 text-gray-900 placeholder-gray-400"
          />
        </div>
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {FORMAT_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="gs-card p-12 flex items-center justify-center text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="gs-card p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
          <FileX size={36} className="text-gray-300" />
          <p className="text-sm font-medium">문서가 없습니다</p>
          <p className="text-xs">문서를 생성하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="gs-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                <th className="text-left p-4">문서명</th>
                <th className="text-left p-4">형식</th>
                <th className="text-left p-4">생성일</th>
                <th className="text-left p-4">크기</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FolderOpen size={16} className="text-gray-500" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 line-clamp-1">{doc.filename}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: getFormatBadgeColor(doc.format) }}
                    >
                      {getFormatLabel(doc.format)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{formatFileSize(doc.size_bytes)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <a
                        href={getDownloadUrl(doc.file_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Download size={12} /> 다운로드
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
