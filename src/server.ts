import { PrismaClient } from "@prisma/client";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {

    //console.log(`Conteúdo do body enviado na requisição: ${req.body.title}`);
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        const movieWithSameTitle = await prisma.movie.findFirst({
            where: {
                title: {
                    equals: title,
                    mode: "insensitive"
                }
            }
        });

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Já existe um filme cadastrado com esse título" });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date)
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar um filme" })
    }
    res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
    // console.log(req.params.id);
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: id
            }
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        const data = { ...req.body };
        //console.log(data);
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;


        await prisma.movie.update({
            where: { id: id },
            data: data
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
    }

    res.status(200).send({ message: "Filme atualizado com sucesso" });

});

app.get("/movies/:genreName", async (req, res) => {
    // console.log(req.params.genreName);

    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive"
                    }
                }
            }
        });

        res.status(200).send(moviesFilteredByGenreName);

    } catch (error) {
        res.status(500).send({ message: "Falha ao filtrar filmes por gênero" });
    }
});

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: id
            }
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encotrado" });
        };

        await prisma.movie.delete({ where: { id: id } });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao remover o registro do filme" });
    }
    res.status(200).send();
});

app.put("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);
    const name = req.body.name;

    if (!name) {
        return res.status(400).send({ message: "O nome do gênero é obrigatório." });
    };

    try {
        const genre = await prisma.genre.findUnique({
            where: { id }
        });

        if (!genre) {
            return res.status(404).send({ message: "Gênero não encontrado" });
        };

        const genreWithSameName = await prisma.genre.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        });

        if (genreWithSameName) {
            return res.status(409).send({ message: "Já existe um gênero cadastrado com esse nome" });
        }

        await prisma.genre.update({
            where: { id },
            data: { name }
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar dados de gênero" });
    }

    res.status(200).send({ message: "Gênero atualizado com sucesso" });

});

app.post("/genres", async (req, res) => {
    const name = req.body.name;

    if (!name) {
        return res.status(400).send({ message: "O nome do gênero é obrigatório." });
    };

    try {
        const genreWithSameName = await prisma.genre.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        });

        if (genreWithSameName) {
            return res.status(409).send({ message: "Já existe um gênero cadastrado com esse nome" });
        }

        await prisma.genre.create({
            data: { name }
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar um gênero" });
    }
    res.status(201).send({ message: "Gênero cadastrado com sucesso" });
});

app.get("/genres", async (_, res) => {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: {
                name: "asc",
            }
        });

        res.json(genres);
    } catch (error) {
        return res.status(500).send({ message: "Falha ao obter lista de gêneros" });
    }
});






app.delete("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const genre = await prisma.genre.findUnique({
            where: {
                id: id
            }
        });

        if (!genre) {
            return res.status(404).send({ message: "Gênero não encotrado" });
        };

        await prisma.genre.delete({ where: { id: id } });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao remover o registro de gênero" });
    }
    res.status(200).send({ message: "Gênero removido com sucesso" });
});








app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
