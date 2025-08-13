// src/lib/rag/validation.js (version 1.0)

// --- Constants ---
const HIGH_CONFIDENCE_THRESHOLD = 0.75;
const SIMILARITY_THRESHOLD = 0.38;

// --- Helper Functions (Internal to this module) ---
function simpleEntityExtractor(text, sourceIdentifier) {
    const match = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
    if (match) return [{ name: match[0], facts: [text] }];
    return [{ name: sourceIdentifier, facts: [text] }];
}

function extractEntitiesFromRAG(ragResults) {
    if (!ragResults) return [];
    return ragResults.flatMap(r => simpleEntityExtractor(r.metadata?.summary || '', r.metadata?.headline || 'RAG Source'));
}

function extractEntitiesFromWiki(wikiResults) {
    if (!wikiResults) return [];
    return wikiResults.flatMap(w => simpleEntityExtractor(w.summary || '', w.title || 'Wiki Source'));
}

function entitySimilarity(entityA, entityB) {
    const nameA = entityA.name.toLowerCase();
    const nameB = entityB.name.toLowerCase();
    if (nameA.includes(nameB) || nameB.includes(nameA)) return 0.9;
    return 0;
}

function factsConflict(factsA, factsB) {
    // Placeholder for a future NLI model implementation.
    return false;
}

// --- Exported Validation Functions ---

export function assessContextQuality(ragResults, wikiResults) {
    const ragScore = ragResults.length > 0 ? Math.max(...ragResults.map(r => r.score)) : 0;
    const highQualityWiki = wikiResults.filter(r => r.validation?.quality === 'high').length;
    const mediumQualityWiki = wikiResults.filter(r => r.validation?.quality === 'medium').length;
    const wikiScore = highQualityWiki > 0 ? 0.7 : (mediumQualityWiki > 0 ? 0.5 : 0);
    const combinedScore = Math.max(ragScore, wikiScore);

    return {
        hasHighConfidenceRAG: ragScore >= HIGH_CONFIDENCE_THRESHOLD,
        hasSufficientContext: combinedScore >= SIMILARITY_THRESHOLD,
        ragResultCount: ragResults.length,
        wikiResultCount: wikiResults.length,
        highQualityWikiCount: highQualityWiki,
        maxSimilarity: ragScore,
        combinedConfidence: combinedScore,
        hasMultipleSources: ragResults.length > 0 && wikiResults.length > 0,
        hasHighQualityContent: ragScore >= HIGH_CONFIDENCE_THRESHOLD || highQualityWiki > 0
    };
}

export function crossValidateSources(ragResults, wikiResults) {
    const validation = { conflicts: [], confirmations: [], reliability: 'unknown' };

    if (!ragResults || !wikiResults || ragResults.length === 0 || wikiResults.length === 0) {
        validation.reliability = 'single_source';
        return validation;
    }

    const ragEntities = extractEntitiesFromRAG(ragResults);
    const wikiEntities = extractEntitiesFromWiki(wikiResults);

    ragEntities.forEach(ragEntity => {
        const matchingWiki = wikiEntities.find(wiki => entitySimilarity(ragEntity, wiki) > 0.8);
        if (matchingWiki) {
            if (factsConflict(ragEntity.facts, matchingWiki.facts)) {
                validation.conflicts.push({ entity: ragEntity.name, ragFact: ragEntity.facts[0], wikiFact: matchingWiki.facts[0], severity: 'high' });
            } else {
                validation.confirmations.push({ entity: ragEntity.name, confirmedBy: 'both_sources' });
            }
        }
    });

    if (validation.conflicts.length > 0) validation.reliability = 'conflicting';
    else if (validation.confirmations.length > 0) validation.reliability = 'confirmed';
    else validation.reliability = 'unconfirmed';

    return validation;
}

export function detectHallucinations(responseText, sources) {
    const combinedSourceText = sources.map(s => s.metadata?.summary || s.summary || '').join(' ').toLowerCase();
    const sentences = responseText.split('.').filter(s => s.trim().length > 10);
    let supportedSentences = 0;

    if (combinedSourceText.length === 0 || sentences.length === 0) {
        return { confidenceScore: 0, recommendation: 'reject' };
    }

    sentences.forEach(sentence => {
        const keywords = sentence.toLowerCase().trim().split(' ').filter(w => w.length > 4);
        if (keywords.length === 0) {
            supportedSentences++;
            return;
        }
        const supportedKeywords = keywords.filter(k => combinedSourceText.includes(k));
        if ((supportedKeywords.length / keywords.length) > 0.5) {
            supportedSentences++;
        }
    });

    const confidenceScore = supportedSentences / sentences.length;
    return {
        confidenceScore,
        recommendation: confidenceScore > 0.6 ? 'approve' : 'reject'
    };
}

export function generateQualityReport({ contextQuality, validation, hallucinationReport, responseLength, sourceCount }) {
    let overallScore = 0;
    const weaknesses = [];

    overallScore += (contextQuality.combinedConfidence || 0) * 0.4;
    overallScore += (hallucinationReport.confidenceScore || 0) * 0.4;
    
    if (validation.reliability === 'confirmed') overallScore += 0.2;
    else if (validation.reliability === 'conflicting') {
        overallScore -= 0.3;
        weaknesses.push('Sources are conflicting.');
    }

    if (sourceCount === 0) {
        overallScore = 0;
        weaknesses.push('No sources found.');
    }

    overallScore = Math.max(0, Math.min(1, overallScore));
    return {
        overallScore,
        recommendation: overallScore > 0.55 ? 'approve' : 'reject',
        weaknesses,
    };
}

export function generateConfidenceDisclaimer(contextQuality, sourceValidation) {
    let disclaimer = 'Based on the available information';
    if (contextQuality.hasHighConfidenceRAG) disclaimer = 'Based on high-confidence internal documents';
    else if (contextQuality.hasSufficientContext) disclaimer = 'Based on a preliminary analysis of available documents';
    else return 'I could not find sufficient information to answer this question reliably.';

    if (sourceValidation.reliability === 'confirmed' && contextQuality.hasMultipleSources) disclaimer += ', which have been cross-validated from multiple sources.';
    else if (sourceValidation.reliability === 'conflicting') disclaimer += '. **Warning:** Some sources presented conflicting information, which may affect the accuracy of this summary.';
    else if (contextQuality.ragResultCount > 0 && contextQuality.wikiResultCount === 0) disclaimer += ', primarily from the internal database.';
    else if (contextQuality.ragResultCount === 0 && contextQuality.wikiResultCount > 0) disclaimer += ', primarily from Wikipedia.';
    
    return `> *${disclaimer}*`;
}