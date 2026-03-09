import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ZoneType } from '@/types/game';

interface ZoneProps {
    id: ZoneType;
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Zone: React.FC<ZoneProps> = ({ id, className = '', children, onClick, style: propsStyle }) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    const style: React.CSSProperties = {
        // Add a subtle highlight when dragging over the zone
        boxShadow: isOver ? 'inset 0 0 10px rgba(255, 255, 255, 0.5)' : undefined,
        cursor: onClick ? 'pointer' : undefined
    };

    return (
        <div ref={setNodeRef} style={{ ...style, ...propsStyle }} className={`droppable-zone ${className}`} onClick={onClick}>
            {children}
        </div>
    );
};
