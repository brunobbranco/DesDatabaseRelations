import { getRepository, Repository, In, UpdateQueryBuilder } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({
      id: In(productsId),
    });

    if (productsId.length !== findProducts.length) {
      throw new AppError('An id was not found');
    }

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.ormRepository.findByIds(products);

    const listProducts = productsData.map(productData => {
      const foundProduct = products.find(
        product => product.id === productData.id,
      );
      if (!foundProduct) {
        throw new AppError('Product not found');
      }
      if (productData.quantity < foundProduct.quantity) {
        throw new AppError('Insuficient quantity to a product');
      }

      const retProduct = productData;
      retProduct.quantity -= foundProduct.quantity;

      return retProduct;
    });

    await this.ormRepository.save(listProducts);

    return listProducts;

    // const updatedProducts: Product[] = [];
    // products.map(loopProducts => async (): Promise<Product[]> => {
    //   const retUpdate = await this.ormRepository
    //     .createQueryBuilder('updateQuantity')
    //     .update()
    //     .set({ quantity: loopProducts.quantity })
    //     .where('id = :id', { id: loopProducts.id });
    //   updatedProducts.push(retUpdate);
    // });
  }
}

export default ProductsRepository;
