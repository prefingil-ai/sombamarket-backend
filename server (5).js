require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Vérifier mot de passe admin
function checkAdmin(req, res) {
    const pass = req.headers['x-admin-password'];
    if (pass !== process.env.ADMIN_PASSWORD) {
        res.status(401).json({ error: 'Non autorisé' });
        return false;
    }
    return true;
}

// ─── TEST ───
app.get('/', (req, res) => {
    res.json({ status: '✅ SombaMarket Backend OK', version: '1.0.0' });
});

// ─── CATEGORIES ───
app.get('/categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('somba_categories')
            .select('*')
            .order('ordre');
        if (error) throw error;
        res.json({ categories: data || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/categories/:id', async (req, res) => {
    if (!checkAdmin(req, res)) return;
    const { image_url } = req.body;
    try {
        const { data, error } = await supabase
            .from('somba_categories')
            .update({ image_url, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json({ success: true, category: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PRODUITS ───
app.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('somba_products')
            .select('*')
            .eq('actif', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ products: data || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/products', async (req, res) => {
    if (!checkAdmin(req, res)) return;
    const { nom, categorie, sous_categorie, prix, ancien_prix, description, importance, mode_emploi, image_url, video_url, badge, unite } = req.body;
    if (!nom || !prix || !categorie) return res.status(400).json({ error: 'Nom, prix et catégorie requis' });
    try {
        const { data, error } = await supabase
            .from('somba_products')
            .insert([{ nom, categorie, sous_categorie: sous_categorie || '', prix: parseFloat(prix), ancien_prix: ancien_prix ? parseFloat(ancien_prix) : null, description: description || '', importance: importance || '', mode_emploi: mode_emploi || '', image_url: image_url || '', video_url: video_url || '', badge: badge || '⭐ Nouveau', unite: unite || '', actif: true, est_base: false }])
            .select();
        if (error) throw error;
        res.json({ success: true, product: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/products/:id', async (req, res) => {
    if (!checkAdmin(req, res)) return;
    const { nom, categorie, sous_categorie, prix, ancien_prix, description, importance, mode_emploi, image_url, video_url, badge, unite } = req.body;
    try {
        const updates = {};
        if (nom !== undefined) updates.nom = nom;
        if (categorie !== undefined) updates.categorie = categorie;
        if (sous_categorie !== undefined) updates.sous_categorie = sous_categorie;
        if (prix !== undefined) updates.prix = parseFloat(prix);
        if (ancien_prix !== undefined) updates.ancien_prix = ancien_prix ? parseFloat(ancien_prix) : null;
        if (description !== undefined) updates.description = description;
        if (importance !== undefined) updates.importance = importance;
        if (mode_emploi !== undefined) updates.mode_emploi = mode_emploi;
        if (image_url !== undefined) updates.image_url = image_url;
        if (video_url !== undefined) updates.video_url = video_url;
        if (badge !== undefined) updates.badge = badge;
        if (unite !== undefined) updates.unite = unite;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('somba_products')
            .update(updates)
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json({ success: true, product: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/products/:id', async (req, res) => {
    if (!checkAdmin(req, res)) return;
    try {
        const { error } = await supabase
            .from('somba_products')
            .update({ actif: false })
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`✅ SombaMarket Backend port ${PORT}`));
