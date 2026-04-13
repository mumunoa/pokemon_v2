"use client";

import React, { useState, useEffect, useRef } from 'react';
import { POKEMON_DATA, PokemonEntry } from '../pokemonData';

interface Props {
  value?: number;
  onChange: (id: number) => void;
  placeholder?: string;
}

export const PokemonSearch: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<PokemonEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初期値の日本語名を表示
  useEffect(() => {
    if (value) {
      const p = POKEMON_DATA.find(item => item.id === value);
      if (p) setQuery(p.ja);
    }
  }, [value]);

  // 日本語での絞り込み検索ロジック
  useEffect(() => {
    if (isOpen) {
      if (query.length > 0) {
        const filtered = POKEMON_DATA.filter(p => 
          p.ja.includes(query) || p.id.toString() === query
        );
        setResults(filtered);
      } else {
        // クエリが空の場合は全件表示（プルダウン動作）
        setResults(POKEMON_DATA);
      }
    } else {
      setResults([]);
    }
  }, [query, isOpen]);

  // クリック外判定
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-red-500 outline-none transition-colors"
      />
      
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {results.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                setQuery(p.ja);
                onChange(p.id);
                setIsOpen(false);
              }}
              className="px-4 py-2 hover:bg-slate-700 cursor-pointer flex items-center justify-between group"
            >
              <span className="text-sm font-bold text-slate-200">{p.ja}</span>
              <span className="text-xs text-slate-500 group-hover:text-red-400">No.{p.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
