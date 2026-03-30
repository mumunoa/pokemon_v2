export const SAMPLE_DECKS = [
    { name: 'ドラパルトexデッキ', code: 'NNnNgn-BArOp8-9NL6gn' },
    { name: 'タケルライコexデッキ', code: '5F515V-z9mey2-5ffbkV' },
    { name: 'メガルカリオexデッキ', code: 'MEp2yX-7wFGpK-RyMppM' }
];

export const isSampleDeckCode = (code: string) => {
    return SAMPLE_DECKS.some(sd => sd.code === code);
};
