import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	SerializedEditor,
	SerializedLexicalNode,
	Spread,
} from "lexical";

import { createEditor, DecoratorNode } from "lexical";
import { Suspense } from "react";
import ImageComponent from "./ImageComponents";

export interface ImagePayload {
	altText: string;
	caption?: LexicalEditor;
	height?: number;
	key?: NodeKey;
	maxWidth?: number;
	showCaption?: boolean;
	src: string;
	width?: number;
	alignment?: ImageAlignment;
	captionsEnabled?: boolean;
	uploaded?: boolean;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
	if (domNode instanceof HTMLImageElement) {
		const { alt: altText, src, height, width } = domNode;
		const node = $createImageNode({
			altText,
			src,
			alignment: "center",
			height,
			width,
		});
		return { node };
	}
	return null;
}

export type SerializedImageNode = Spread<
	{
		altText: string;
		caption: SerializedEditor;
		height?: number;
		maxWidth: number;
		showCaption: boolean;
		src: string;
		width?: number;
		type: "image";
		alignment: ImageAlignment;
		uploaded: boolean;
		version: 1;
	},
	SerializedLexicalNode
>;

export type ImageAlignment = "left" | "center" | "right";
export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;
	__width: "inherit" | number;
	__height: "inherit" | number;
	__maxWidth: number;
	__showCaption: boolean;
	__caption: LexicalEditor;
	__alignment: ImageAlignment = "center";
	__captionsEnabled: boolean;
	__uploaded = false;

	static getType(): string {
		return "image";
	}

	getIsUploaded(): boolean {
		return this.__uploaded;
	}

	setIsUploaded(isUploaded: boolean) {
		const writable = this.getWritable();
		writable.__uploaded = isUploaded;
	}

	getAlignment() {
		return this.__alignment;
	}

	getTextContent(): string {
		return "";
	}

	setAlignment(alignment: ImageAlignment) {
		const writable = this.getWritable();
		writable.__alignment = alignment;
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__altText,
			node.__maxWidth,
			node.__width,
			node.__height,
			node.__showCaption,
			node.__caption,
			node.__captionsEnabled,
			node.__alignment,
			node.__key,
			node.__uploaded
		);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const {
			altText,
			height,
			width,
			maxWidth,
			caption,
			src,
			showCaption,
			alignment,
			uploaded,
		} = serializedNode;
		const node = $createImageNode({
			altText,
			height,
			maxWidth,
			showCaption,
			src,
			width,
			alignment,
			uploaded,
		});
		const nestedEditor = node.__caption;
		const editorState = nestedEditor.parseEditorState(caption.editorState);
		if (!editorState.isEmpty()) {
			nestedEditor.setEditorState(editorState);
		}
		return node;
	}

	setFormat(_newFormat: string) {
		// console.debug(newFormat);
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement("img");
		element.setAttribute("src", this.__src);
		element.setAttribute("alt", this.__altText);
		return { element };
	}

	isInline(): boolean {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: convertImageElement,
				priority: 0,
			}),
		};
	}

	constructor(
		src: string,
		altText: string,
		maxWidth: number,
		width?: "inherit" | number,
		height?: "inherit" | number,
		showCaption?: boolean,
		caption?: LexicalEditor,
		captionsEnabled?: boolean,
		alignment?: ImageAlignment,
		key?: NodeKey,
		uploaded?: boolean
	) {
		super(key);
		this.__src = src;
		this.__altText = altText;
		this.__maxWidth = maxWidth;
		this.__width = width || "inherit";
		this.__height = height || "inherit";
		this.__showCaption = showCaption || false;
		this.__caption = caption || createEditor();
		this.__alignment = alignment || "left";
		this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
		this.__uploaded = uploaded || false;
	}

	exportJSON(): SerializedImageNode {
		return {
			altText: this.getAltText(),
			caption: this.__caption.toJSON(),
			height: this.__height === "inherit" ? 0 : this.__height,
			maxWidth: this.__maxWidth,
			showCaption: this.__showCaption,
			src: this.getSrc(),
			type: "image",
			version: 1,
			alignment: this.getAlignment(),
			uploaded: this.getIsUploaded(),
			width: this.__width === "inherit" ? 0 : this.__width,
		};
	}

	setWidthAndHeight(
		width: "inherit" | number,
		height: "inherit" | number
	): void {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}

	setShowCaption(showCaption: boolean): void {
		const writable = this.getWritable();
		writable.__showCaption = showCaption;
	}

	// View

	createDOM(config: EditorConfig): HTMLElement {
		const div = document.createElement("div");
		div.style.display = "block";
		const theme = config.theme;
		const className = theme.image;
		if (className !== undefined) {
			div.className = className;
		}
		return div;
	}

	updateDOM(): false {
		return false;
	}

	getSrc(): string {
		return this.__src;
	}

	setSrc(newSrc: string) {
		const updateNode = this.getWritable();
		updateNode.__src = newSrc;
	}

	getAltText(): string {
		return this.__altText;
	}

	decorate(): JSX.Element {
		return (
			<Suspense fallback={null}>
				<ImageComponent
					alignment={this.getAlignment()}
					altText={this.__altText}
					height={this.__height}
					maxWidth={this.__maxWidth}
					nodeKey={this.__key}
					resizable
					src={this.__src}
					width={this.__width}
				/>
			</Suspense>
		);
	}
}

export function $createImageNode({
	altText,
	height,
	maxWidth = 800,
	captionsEnabled,
	src,
	width,
	showCaption,
	caption,
	alignment,
	key,
	uploaded,
}: ImagePayload): ImageNode {
	return new ImageNode(
		src,
		altText,
		maxWidth,
		width,
		height,
		showCaption,
		caption,
		captionsEnabled,
		alignment,
		key,
		uploaded
	);
}

export function $isImageNode(
	node: LexicalNode | null | undefined
): node is ImageNode {
	return node instanceof ImageNode;
}
