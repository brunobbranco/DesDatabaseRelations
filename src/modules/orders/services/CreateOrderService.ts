import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import { FindOperator } from 'typeorm';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists.');
    }

    const productsId = products.map(product => {
      return { id: product.id };
    });

    const productsData = await this.productsRepository.findAllById(productsId);

    const finalProducts = productsData.map(product => {
      const finalProduct = products.find(
        findProduct => findProduct.id === product.id,
      );

      return {
        product_id: product.id,
        price: product.price,
        quantity: finalProduct?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: finalProducts,
    });

    if (!order) {
      throw new AppError('Error creating order');
    }

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
