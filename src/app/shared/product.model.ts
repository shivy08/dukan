class Details{
    detailType: string;
    detailDesc: string;
}

//structure of a product
export class Product{
    constructor(
    public id: string,
    public category: string,
    public name: string,
    public imagePath: string,
    public description: string,
    public price: number,
    public details: Details[],
    public isBestSeller:boolean,
    public tags:string[]
    )
    {}
}