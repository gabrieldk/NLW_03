import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup';

import Orphanage from '../models/Orphanage';

export default {
  async index(request: Request, response: Response){
    const orphanagesRepository = getRepository(Orphanage); // pega o repositório

    const orphanages = await orphanagesRepository.find({
      relations: ['images']
    }); // pega as tabelas do banco de dados

    return response.json(orphanageView.renderMany(orphanages)); // retorna as tabelas para a requisição
  },

  async show(request: Request, response: Response){
    const { id } = request.params; // id da tupla requisitada

    const orphanagesRepository = getRepository(Orphanage); // pega o repositório

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images']
    }); // pega a tabela do banco de dados com o id correspondente

    return response.json(orphanageView.render(orphanage)); // retorna as tabelas para a requisição
  },

  async create(request: Request, response: Response) {
    const {
        name,
        latitude,
        longitude,
        about,
        instructions,
        opening_hours,
        open_on_weekends
    } = request.body; // pega os elementos enviados front-end

    const orphanagesRepository = getRepository(Orphanage); // 

    const requestImage = request.files as Express.Multer.File[];

    const images = requestImage.map(image => {
      return { path: image.filename }
    });

    const data = {
        name,
        latitude,
        longitude,
        about,
        instructions,
        opening_hours,
        open_on_weekends: open_on_weekends === 'true',
        images
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required()
        })
      )
    });

    await schema.validate(data, {
      abortEarly: false,
    });

    const orphanage = orphanagesRepository.create(data); // deixa o orfanato criado, mas ainda não está no banco de dados

    // salva no banco de dados
    await orphanagesRepository.save(orphanage);

    return response.status(201).json(orphanage);
  }
};