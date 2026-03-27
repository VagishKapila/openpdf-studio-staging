import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight, LayoutGrid, Table, Search, X } from 'lucide-react';
import { useOrgDocuments } from '@/lib/hooks';
import type { Organization, DocumentRecord } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

const KANBAN_COLUMNS = ['draft', 'sent', 'viewed', 'signed', 'paid', 'completed'] as const;
const COLUMN_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  signed: 'Signed',
  paid: 'Paid',
  completed: 'Completed',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  signed: 'bg-green-100 text-green-700',
  paid: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-500',
};

const TABLE_STATUSES = ['', 'draft', 'sent', 'viewed', 'signed', 'paid', 'completed'];
const TABLE_STATUS_LABELS: Record<string, string> = {
  '': 'All',
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  signed: 'Signed',
  paid: 'Paid',
  completed: 'Completed',
};

interface DocumentDetailProps {
  doc: DocumentRecord | null;
  onClose: () => void;
}

function DocumentDetailModal({ doc, onClose }: DocumentDetailProps) {
  if (!doc) return null;

  const fileName = doc.fileName || doc.originalFileName || 'Unknown';
  const fileSize = doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
  const pages = doc.pageCount || 0;
  const createdDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const updatedDate = new Date(doc.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Document Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">File Name</label>
            <p className="text-sm text-gray-900 font-medium mt-1 break-words">{fileName}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
            <div className="mt-1">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {COLUMN_LABELS[doc.status as keyof typeof COLUMN_LABELS] || doc.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">File Size</label>
              <p className="text-sm text-gray-900 mt-1">{fileSize}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Pages</label>
              <p className="text-sm text-gray-900 mt-1">{pages}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Created</label>
            <p className="text-sm text-gray-900 mt-1">{createdDate}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Last Updated</label>
            <p className="text-sm text-gray-900 mt-1">{updatedDate}</p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface KanbanCardProps {
  doc: DocumentRecord;
  onCardClick: (doc: DocumentRecord) => void;
  onDragStart: (e: React.DragEvent, doc: DocumentRecord) => void;
}

function KanbanCard({ doc, onCardClick, onDragStart }: KanbanCardProps) {
  const fileName = doc.fileName || doc.originalFileName || 'Unknown';
  const fileSize = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'N/A';
  const createdDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, doc)}
      onClick={() => onCardClick(doc)}
      className="p-3 bg-white rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{fileName}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{fileSize}</span>
        <span className="text-xs text-gray-400">{createdDate}</span>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: string;
  documents: DocumentRecord[];
  onCardClick: (doc: DocumentRecord) => void;
  onDragStart: (e: React.DragEvent, doc: DocumentRecord) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStatus: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

function KanbanColumn({
  status,
  documents,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  isDragOver,
}: KanbanColumnProps) {
  const columnLabel = COLUMN_LABELS[status] || status;
  const count = documents.length;

  return (
    <div className="flex flex-col gap-4 min-w-80">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{columnLabel}</h3>
        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
          {count}
        </span>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
        onDragLeave={onDragLeave}
        className={`flex-1 p-3 rounded-lg border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No documents</p>
            </div>
          ) : (
            documents.map((doc) => (
              <KanbanCard
                key={doc.id}
                doc={doc}
                onCardClick={onCardClick}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PortalDocuments() {
  const { slug } = useOutletContext<PortalContext>();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [tableStatus, setTableStatus] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [draggedDoc, setDraggedDoc] = useState<DocumentRecord | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data, isLoading } = useOrgDocuments(slug, {
    page: viewMode === 'table' ? tablePage : 1,
    limit: viewMode === 'table' ? 20 : 500,
    status: viewMode === 'table' ? tableStatus : '',
  });

  const docs = data?.data || [];
  const meta = data?.meta;

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const fileName = (doc.fileName || doc.originalFileName || '').toLowerCase();
      return fileName.includes(searchQuery.toLowerCase());
    });
  }, [docs, searchQuery]);

  const docsByStatus = useMemo(() => {
    if (viewMode !== 'kanban') return {};

    const grouped: Record<string, DocumentRecord[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col] = [];
    });

    filteredDocs.forEach((doc) => {
      if (doc.status && grouped[doc.status as keyof typeof grouped]) {
        grouped[doc.status as keyof typeof grouped]!.push(doc);
      }
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key as keyof typeof grouped]!.sort((a: DocumentRecord, b: DocumentRecord) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return grouped;
  }, [filteredDocs, viewMode]);

  const handleDragStart = (e: React.DragEvent, doc: DocumentRecord) => {
    setDraggedDoc(doc);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedDoc && draggedDoc.status !== targetStatus) {
      console.log(`Move document ${draggedDoc.id} from ${draggedDoc.status} to ${targetStatus}`);
    }
    setDraggedDoc(null);
    setDragOverColumn(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">View and manage your organization's documents</p>
      </div>

      {viewMode === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setViewMode('table')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Switch to table view"
            >
              <Table className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocs.length === 0 && searchQuery ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents match your search</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6 min-w-max pr-4">
                {KANBAN_COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    documents={(docsByStatus[status as keyof typeof docsByStatus] || []) as DocumentRecord[]}
                    onCardClick={setSelectedDoc}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    isDragOver={dragOverColumn === status}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto flex-1">
              {TABLE_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setTableStatus(s);
                    setTablePage(1);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    tableStatus === s
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {TABLE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode('kanban')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Switch to kanban view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading documents...</div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents found</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                        Name
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                        Size
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {docs.map((doc) => {
                      const fileName = doc.fileName || doc.originalFileName || 'Unknown';
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{fileName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {COLUMN_LABELS[doc.status as keyof typeof COLUMN_LABELS] || doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                        disabled={tablePage === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setTablePage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={tablePage === meta.totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
}
