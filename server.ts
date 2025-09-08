import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { promises as fs } from 'fs';

// Types TypeScript
interface Agent {
    idAgent: number;
    pseudo: string;
    discordAgent: string | null;
    actif: boolean;
    role: string[];
    comments?: Array<{
        texte: string;
        date: string;
    }>;
}

interface AgentFormData {
    pseudo: string;
    discordAgent?: string;
    role?: string[];
    actif?: boolean;
    comments?: string;
}

interface AgentsData {
    metadata: {
        version: string;
        description: string;
        timestamps_in_ms: boolean;
        notes: string;
    };
    agents: Agent[];
    clients: any[];
}

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static('public'));

// Chemin vers le fichier JSON des agents
const AGENTS_FILE: string = path.join(__dirname, 'agents.json');

// Fonction utilitaire pour lire le fichier JSON
async function readAgentsFile(): Promise<AgentsData> {
    try {
        const data = await fs.readFile(AGENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier agents:', error);
        return {
            metadata: {
                version: "1.0",
                description: "Modèle JSON pour CDC app V1",
                timestamps_in_ms: true,
                notes: "Ne pas stocker total_commissions statique"
            },
            agents: [],
            clients: []
        };
    }
}

// Fonction utilitaire pour écrire dans le fichier JSON
async function writeAgentsFile(data: AgentsData): Promise<boolean> {
    try {
        await fs.writeFile(AGENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'écriture du fichier agents:', error);
        return false;
    }
}

// Fonction utilitaire pour générer un nouvel ID
function generateNewId(agents: Agent[]): number {
    if (agents.length === 0) return 1;
    const maxId = Math.max(...agents.map(agent => agent.idAgent));
    return maxId + 1;
}

// Routes API pour les agents

// GET /api/agents - Récupérer tous les agents
app.get('/api/agents', async (req: Request, res: Response) => {
    try {
        const data = await readAgentsFile();
        res.json(data);
    } catch (error) {
        console.error('Erreur GET /api/agents:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// GET /api/agents/:id - Récupérer un agent par ID
app.get('/api/agents/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await readAgentsFile();
        const agent = data.agents.find(a => a.idAgent === parseInt(id));
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        res.json(agent);
    } catch (error) {
        console.error('Erreur GET /api/agents/:id:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// POST /api/agents - Créer un nouvel agent
app.post('/api/agents', async (req: Request, res: Response) => {
    try {
        const { pseudo, discordAgent, role, actif, comments }: AgentFormData = req.body;
        
        // Validation des données
        if (!pseudo || pseudo.trim() === '') {
            return res.status(400).json({ error: 'Le pseudo est obligatoire' });
        }
        
        const data = await readAgentsFile();
        const newAgent: Agent = {
            idAgent: generateNewId(data.agents),
            pseudo: pseudo.trim(),
            discordAgent: discordAgent || null,
            actif: actif !== false, // Par défaut actif
            role: Array.isArray(role) ? role : [],
            comments: comments ? [{ 
                texte: comments, 
                date: new Date().toISOString() 
            }] : []
        };
        
        data.agents.push(newAgent);
        
        if (await writeAgentsFile(data)) {
            res.status(201).json(newAgent);
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur POST /api/agents:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// PUT /api/agents/:id - Mettre à jour un agent
app.put('/api/agents/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { pseudo, discordAgent, role, actif, comments }: AgentFormData = req.body;
        
        // Validation des données
        if (!pseudo || pseudo.trim() === '') {
            return res.status(400).json({ error: 'Le pseudo est obligatoire' });
        }
        
        const data = await readAgentsFile();
        const agentIndex = data.agents.findIndex(a => a.idAgent === parseInt(id));
        
        if (agentIndex === -1) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        // Mise à jour de l'agent
        data.agents[agentIndex] = {
            ...data.agents[agentIndex],
            pseudo: pseudo.trim(),
            discordAgent: discordAgent || null,
            actif: actif !== false,
            role: Array.isArray(role) ? role : [],
            comments: comments ? [{ 
                texte: comments, 
                date: new Date().toISOString() 
            }] : []
        };
        
        if (await writeAgentsFile(data)) {
            res.json(data.agents[agentIndex]);
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur PUT /api/agents/:id:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// PATCH /api/agents/:id - Mettre à jour partiellement un agent
app.patch('/api/agents/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates: Partial<Agent> = req.body;
        
        const data = await readAgentsFile();
        const agentIndex = data.agents.findIndex(a => a.idAgent === parseInt(id));
        
        if (agentIndex === -1) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        // Mise à jour partielle
        data.agents[agentIndex] = {
            ...data.agents[agentIndex],
            ...updates
        };
        
        if (await writeAgentsFile(data)) {
            res.json(data.agents[agentIndex]);
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur PATCH /api/agents/:id:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// DELETE /api/agents/:id - Supprimer un agent
app.delete('/api/agents/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await readAgentsFile();
        const agentIndex = data.agents.findIndex(a => a.idAgent === parseInt(id));
        
        if (agentIndex === -1) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        // Suppression de l'agent
        const deletedAgent = data.agents.splice(agentIndex, 1)[0];
        
        if (await writeAgentsFile(data)) {
            res.json({ message: 'Agent supprimé avec succès', deletedAgent });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur DELETE /api/agents/:id:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route pour servir l'application
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erreur globale:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur TeamApp V1 démarré sur le port ${PORT}`);
    console.log(`📱 Interface disponible sur: http://localhost:${PORT}`);
    console.log(`🔌 API disponible sur: http://localhost:${PORT}/api/agents`);
});

export default app;
