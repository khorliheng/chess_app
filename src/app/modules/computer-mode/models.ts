import { FENChar } from "../../chess-logic/models";

export type StockfishQueryParams ={
    fen: string;
    depth: number;
}

export type ChessMove ={
    prevX: number;
    prevY: number;
    newX: number;
    newY: number;
    promotedPiece: FENChar | null;
}

export type StockfishResponse = {
    success: boolean;
    data: string;
}