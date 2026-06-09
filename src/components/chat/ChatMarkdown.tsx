'use client';

import { Fragment, type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMarkdownProps {
    content: string;
    onCopy?: (value: string) => void;
}

interface CodeBlockProps {
    code: string;
    language?: string;
    onCopy?: (value: string) => void;
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const CODE_FENCE_PATTERN = /```([\w-]+)?\n?([\s\S]*?)```/g;
const TABLE_PATTERN = /(\|.+\|\n\|[\s:|-]+\|\n(?:\|.+\|\n?)*)/g;
const KEYWORD_PATTERN =
    /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|async|await|import|export|from|new|class|extends|interface|type|public|private)\b/g;
const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;
const COMMENT_PATTERN = /(\/\/.*$|#.*$)/gm;
const STRING_PATTERN = /("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(INLINE_PATTERN)) {
        if (match.index === undefined) continue;

        const token = match[0];
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (token.startsWith('**')) {
            nodes.push(
                <strong key={`${keyPrefix}-${match.index}`} className="font-semibold text-white">
                    {token.slice(2, -2)}
                </strong>
            );
        } else if (token.startsWith('`')) {
            nodes.push(
                <code
                    key={`${keyPrefix}-${match.index}`}
                    className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[0.92em] text-primary"
                >
                    {token.slice(1, -1)}
                </code>
            );
        } else {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                nodes.push(
                    <a
                        key={`${keyPrefix}-${match.index}`}
                        href={linkMatch[2]}
                        target={linkMatch[2].startsWith('/') ? undefined : '_blank'}
                        rel={linkMatch[2].startsWith('/') ? undefined : 'noreferrer'}
                        className="font-medium text-primary underline decoration-primary/40 underline-offset-4"
                    >
                        {linkMatch[1]}
                    </a>
                );
            }
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function highlightCode(code: string) {
    const combinedPattern = new RegExp(
        `${COMMENT_PATTERN.source}|${STRING_PATTERN.source}|${KEYWORD_PATTERN.source}|${NUMBER_PATTERN.source}`,
        'gm'
    );

    const nodes: ReactNode[] = [];
    let lastIndex = 0;

    for (const match of code.matchAll(combinedPattern)) {
        if (match.index === undefined) continue;

        if (match.index > lastIndex) {
            nodes.push(code.slice(lastIndex, match.index));
        }

        const token = match[0];
        let className = 'text-zinc-200';

        if (/^(\/\/|#)/.test(token)) {
            className = 'text-zinc-500';
        } else if (/^['"`]/.test(token)) {
            className = 'text-emerald-300';
        } else if (/^\d/.test(token)) {
            className = 'text-amber-300';
        } else {
            className = 'text-cyan-300';
        }

        nodes.push(
            <span key={`${match.index}-${token.length}`} className={className}>
                {token}
            </span>
        );

        lastIndex = match.index + token.length;
    }

    if (lastIndex < code.length) {
        nodes.push(code.slice(lastIndex));
    }

    return nodes;
}

function CodeBlock({ code, language, onCopy }: CodeBlockProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-[0_10px_35px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                <span>{language || 'code'}</span>
                <button
                    type="button"
                    onClick={() => onCopy?.(code)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-white/70 transition hover:bg-white/12 hover:text-white"
                >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                </button>
            </div>
            <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-zinc-200 scrollbar-thin">
                <code>{highlightCode(code)}</code>
            </pre>
        </div>
    );
}

function MarkdownTable({ tableMarkdown }: { tableMarkdown: string }) {
    const lines = tableMarkdown.trim().split('\n');
    if (lines.length < 2) return null;

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split('|').filter((h) => h.trim()).map((h) => h.trim());

    // Parse alignment from separator row
    const separatorLine = lines[1];
    const alignments = separatorLine.split('|').filter((s) => s.trim()).map((s) => {
        const trimmed = s.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        if (trimmed.startsWith(':')) return 'left';
        return 'left';
    });

    // Parse body rows
    const rows = lines.slice(2)
        .filter((line) => line.trim())
        .map((line) => 
            line.split('|').filter((cell) => cell.trim()).map((cell) => cell.trim())
        );

    return (
        <div className="my-4 w-full overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] scrollbar-thin">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {headers.map((header, idx) => (
                            <th
                                key={idx}
                                className="border-b border-white/10 bg-white/[0.05] px-3 py-2 text-left font-semibold text-white"
                                style={{ textAlign: (alignments[idx] as any) || 'left' }}
                            >
                                {renderInline(header, `header-${idx}`)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                            {row.map((cell, cellIdx) => (
                                <td
                                    key={cellIdx}
                                    className="px-3 py-2 text-white/75"
                                    style={{ textAlign: (alignments[cellIdx] as any) || 'left' }}
                                >
                                    {renderInline(cell, `cell-${rowIdx}-${cellIdx}`)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function renderBlock(block: string, key: string) {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('>')) {
        return (
            <blockquote
                key={key}
                className="border-l-2 border-primary/40 pl-3 text-white/70 italic"
            >
                {renderInline(trimmed.replace(/^>\s?/gm, ''), key)}
            </blockquote>
        );
    }

    const lines = trimmed.split('\n');
    const isBulletList = lines.every((line) => /^[-*]\s+/.test(line));
    const isOrderedList = lines.every((line) => /^\d+\.\s+/.test(line));

    if (isBulletList) {
        return (
            <ul key={key} className="space-y-2 pl-5 text-white/85">
                {lines.map((line, index) => (
                    <li key={`${key}-${index}`} className="list-disc">
                        {renderInline(line.replace(/^[-*]\s+/, ''), `${key}-${index}`)}
                    </li>
                ))}
            </ul>
        );
    }

    if (isOrderedList) {
        return (
            <ol key={key} className="space-y-2 pl-5 text-white/85">
                {lines.map((line, index) => (
                    <li key={`${key}-${index}`} className="list-decimal">
                        {renderInline(line.replace(/^\d+\.\s+/, ''), `${key}-${index}`)}
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <p key={key} className="leading-7 text-white/85">
            {lines.map((line, index) => (
                <Fragment key={`${key}-${index}`}>
                    {renderInline(line, `${key}-${index}`)}
                    {index < lines.length - 1 ? <br /> : null}
                </Fragment>
            ))}
        </p>
    );
}

export default function ChatMarkdown({ content, onCopy }: ChatMarkdownProps) {
    const blocks: ReactNode[] = [];
    let lastIndex = 0;
    let blockKey = 0;

    // Handle tables first
    const tableMatches = Array.from(content.matchAll(TABLE_PATTERN));
    for (const tableMatch of tableMatches) {
        if (tableMatch.index === undefined) continue;

        const before = content.slice(lastIndex, tableMatch.index);
        if (before.trim()) {
            for (const paragraph of before.split(/\n{2,}/)) {
                const block = renderBlock(paragraph, `block-${blockKey++}`);
                if (block) blocks.push(block);
            }
        }

        blocks.push(
            <MarkdownTable
                key={`table-${blockKey++}`}
                tableMarkdown={tableMatch[0]}
            />
        );

        lastIndex = tableMatch.index + tableMatch[0].length;
    }

    // Handle code blocks
    const remaining = content.slice(lastIndex);
    let processIndex = 0;

    for (const match of remaining.matchAll(CODE_FENCE_PATTERN)) {
        if (match.index === undefined) continue;

        const before = remaining.slice(processIndex, match.index);
        if (before.trim()) {
            for (const paragraph of before.split(/\n{2,}/)) {
                const block = renderBlock(paragraph, `block-${blockKey++}`);
                if (block) blocks.push(block);
            }
        }

        blocks.push(
            <CodeBlock
                key={`code-${blockKey++}`}
                code={match[2].trimEnd()}
                language={match[1]}
                onCopy={onCopy}
            />
        );

        processIndex = match.index + match[0].length;
    }

    const tail = remaining.slice(processIndex);
    if (tail.trim()) {
        for (const paragraph of tail.split(/\n{2,}/)) {
            const block = renderBlock(paragraph, `block-${blockKey++}`);
            if (block) blocks.push(block);
        }
    }

    return (
        <div className={cn('space-y-3 text-[13px] md:text-sm')}>
            {blocks.length ? blocks : <p className="text-white/80">{content}</p>}
        </div>
    );
}
