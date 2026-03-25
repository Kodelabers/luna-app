"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from "react";

type SegmentLabels = Record<string, string>;

const BreadcrumbSegmentContext = createContext<{
	segments: SegmentLabels;
	setSegment: (key: string, value: string) => void;
	removeSegment: (key: string) => void;
}>({ segments: {}, setSegment: () => {}, removeSegment: () => {} });

export function BreadcrumbSegmentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [segments, setSegmentsState] = useState<SegmentLabels>({});

	const setSegment = useCallback((key: string, value: string) => {
		setSegmentsState((prev) => ({ ...prev, [key]: value }));
	}, []);

	const removeSegment = useCallback((key: string) => {
		setSegmentsState((prev) => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	return (
		<BreadcrumbSegmentContext.Provider
			value={{ segments, setSegment, removeSegment }}
		>
			{children}
		</BreadcrumbSegmentContext.Provider>
	);
}

export function useBreadcrumbSegments() {
	return useContext(BreadcrumbSegmentContext).segments;
}

/**
 * Client component that registers a dynamic breadcrumb label from a child layout.
 * Accepts primitive props to avoid object reference instability.
 */
export function BreadcrumbSegmentUpdater({
	segmentKey,
	segmentValue,
}: {
	segmentKey: string;
	segmentValue: string;
}) {
	const { setSegment, removeSegment } = useContext(BreadcrumbSegmentContext);

	useEffect(() => {
		setSegment(segmentKey, segmentValue);
		return () => removeSegment(segmentKey);
	}, [segmentKey, segmentValue, setSegment, removeSegment]);

	return null;
}
