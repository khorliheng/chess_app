import {Piece}  from './piece';
import { FENChar, Coords, Color } from '../models';

export class Knight extends Piece{
    protected override _FENChar:FENChar;
    protected override _directions:Coords[] = [
        {x:2, y:1},
        {x:2, y:-1},
        {x:-2, y:1},
        {x:-2, y:-1},
        {x:1, y:2},
        {x:1, y:-2},
        {x:-1, y:2},
        {x:-1, y:-2}
    ];
    constructor (private pieceColor:Color){
        super(pieceColor);
        this._FENChar = pieceColor === Color.White ? FENChar.WhiteKnight : FENChar.BlackKnight;
    }
}