import { useState, useCallback } from "react";

export function useDisclosure(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onToggle = useCallback(() => setIsOpen((prev) => !prev), []);

    const onOpenChange = useCallback((open: boolean) => setIsOpen(open), []);

    return { isOpen, onOpen, onClose, onToggle, onOpenChange };
}
