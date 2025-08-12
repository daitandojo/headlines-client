// src/lib/qualityControl.js - Comprehensive quality control system

// --- Helper Functions (Stubs for now, can be expanded) ---

/**
 * A very simple NLP-like function to extract "entities" from text.
 * In a real system, this would use a proper NER model.
 * @param {string} text - The text to extract from.
 * @returns {Array<{name: string, facts: string[]}>}
 */
function simpleEntityExtractor(text, sourceIdentifier) {
    // This is a placeholder. A real implementation would be much more complex.
    // For now, let's assume the first capitalized phrase is the entity.
    const match = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
    if (match) {
        return [{ name: match[0], facts: [text] }];
    }
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

/**
 * A basic string similarity check.
 * @param {{name: string}} entityA
 * @param {{name: string}} entityB
 * @returns {number} - Similarity score from 0 to 1
 */
function entitySimilarity(entityA, entityB) {
    const nameA = entityA.name.toLowerCase();
    const nameB = entityB.name.toLowerCase();
    if (nameA.includes(nameB) || nameB.includes(nameA)) {
        return 0.9;
    }
    return 0; // Keep it simple
}

/**
 * Placeholder for fact conflict detection.
 * @param {string[]} factsA
 * @param {string[]} factsB
 * @returns {boolean}
 */
function factsConflict(factsA, factsB) {
    // This is extremely complex. A real implementation would use NLI models.
    // For now, we'll assume no conflicts to avoid false positives.
    return false;
}

// --- Exported Functions ---

/**
 * Cross-validates information between RAG and Wikipedia sources
 * @param {Array} ragResults 
 * @param {Array} wikiResults 
 * @param {string} query 
 * @returns {Object} Validation report
 */
export function crossValidateSources(ragResults, wikiResults, query) {
    const validation = {
        conflicts: [],
        confirmations: [],
        confidence: 0,
        reliability: 'unknown'
    };

    if (!ragResults || !wikiResults || ragResults.length === 0 || wikiResults.length === 0) {
        validation.reliability = 'single_source';
        return validation;
    }

    const ragEntities = extractEntitiesFromRAG(ragResults);
    const wikiEntities = extractEntitiesFromWiki(wikiResults);

    ragEntities.forEach(ragEntity => {
        const matchingWiki = wikiEntities.find(wiki =>
            entitySimilarity(ragEntity, wiki) > 0.8
        );

        if (matchingWiki) {
            if (factsConflict(ragEntity.facts, matchingWiki.facts)) {
                validation.conflicts.push({
                    entity: ragEntity.name,
                    ragFact: ragEntity.facts[0],
                    wikiFact: matchingWiki.facts[0],
                    severity: 'high'
                });
            } else {
                validation.confirmations.push({
                    entity: ragEntity.name,
                    confirmedBy: 'both_sources'
                });
            }
        }
    });

    if (validation.conflicts.length > 0) {
        validation.reliability = 'conflicting';
    } else if (validation.confirmations.length > 0) {
        validation.reliability = 'confirmed';
    } else {
        validation.reliability = 'unconfirmed';
    }
    
    const totalEntities = (ragEntities.length + wikiEntities.length) / 2;
    if (totalEntities > 0) {
        validation.confidence = validation.confirmations.length / totalEntities;
    }

    return validation;
}


/**
 * A simple heuristic-based hallucination detector.
 * @param {string} responseText The generated response.
 * @param {Array} sources The source documents (RAG results + Wiki results).
 * @returns {Object} A hallucination report.
 */
export function detectHallucinations(responseText, sources) {
    const combinedSourceText = sources
        .map(s => s.metadata?.summary || s.summary || '')
        .join(' ')
        .toLowerCase();
    
    const sentences = responseText.split('.').filter(s => s.trim().length > 0);
    const suspiciousStatements = [];
    let supportedSentences = 0;

    if (combinedSourceText.length === 0 || sentences.length === 0) {
        return {
            confidenceScore: 0,
            recommendation: 'reject',
            suspiciousStatements: [{ statement: responseText, reason: "No source text or response to validate." }],
        };
    }

    sentences.forEach(sentence => {
        const cleanSentence = sentence.toLowerCase().trim();
        if (cleanSentence.length < 10) { // Ignore very short sentences
            supportedSentences++;
            return;
        }
        
        // Simple check: does the sentence text appear in the sources?
        // This is a very naive check. A better approach uses n-grams or semantic similarity.
        if (combinedSourceText.includes(cleanSentence.substring(0, 50))) { // Check a snippet
             supportedSentences++;
        } else {
            // A slightly more advanced check for keywords
            const keywords = cleanSentence.split(' ').filter(w => w.length > 4); // get non-trivial words
            if (keywords.length === 0) {
                supportedSentences++;
                return;
            }
            const supportedKeywords = keywords.filter(k => combinedSourceText.includes(k));
            
            if ((supportedKeywords.length / keywords.length) > 0.5) {
                supportedSentences++;
            } else {
                suspiciousStatements.push({
                    statement: sentence,
                    reason: "Content not directly found in sources."
                });
            }
        }
    });

    const confidenceScore = supportedSentences / sentences.length;
    
    return {
        confidenceScore,
        recommendation: confidenceScore > 0.6 ? 'approve' : 'reject',
        suspiciousStatements,
    };
}


/**
 * Generates a quality report for a RAG response.
 * @param {Object} reportData Data needed for the report.
 * @returns {Object} The final quality report.
 */
export function generateQualityReport({ contextQuality, validation, hallucinationReport, responseLength, sourceCount }) {
    let overallScore = 0;
    const weaknesses = [];

    // Base score on context quality
    overallScore += (contextQuality.combinedConfidence || 0) * 0.4;
    
    // Adjust based on hallucination report
    overallScore += (hallucinationReport.confidenceScore || 0) * 0.4;
    if (hallucinationReport.recommendation === 'reject') {
        weaknesses.push('High risk of hallucination.');
    }

    // Adjust based on source validation
    if (validation.reliability === 'confirmed') {
        overallScore += 0.2;
    } else if (validation.reliability === 'conflicting') {
        overallScore -= 0.3;
        weaknesses.push('Sources are conflicting.');
    }

    // Penalize for very short or very long responses
    if (responseLength < 20 || responseLength > 2000) {
        overallScore -= 0.1;
        weaknesses.push('Response length is unusual.');
    }
    
    // Penalize for having no sources
    if (sourceCount === 0) {
        overallScore = 0;
        weaknesses.push('No sources found to support response.');
    }

    overallScore = Math.max(0, Math.min(1, overallScore)); // Clamp score between 0 and 1

    return {
        overallScore,
        recommendation: overallScore > 0.55 ? 'approve' : 'reject',
        weaknesses,
    };
}


/**
 * Generates a human-readable disclaimer about the response confidence.
 * @param {Object} contextQuality
 * @param {Object} sourceValidation
 * @returns {string} The disclaimer text.
 */
export function generateConfidenceDisclaimer(contextQuality, sourceValidation) {
    let disclaimer = 'Based on the available information';

    if (contextQuality.hasHighConfidenceRAG) {
        disclaimer = 'Based on high-confidence internal documents';
    } else if (contextQuality.hasSufficientContext) {
        disclaimer = 'Based on a preliminary analysis of available documents';
    } else {
        return 'I could not find sufficient information to answer this question reliably.';
    }

    if (sourceValidation.reliability === 'confirmed' && contextQuality.hasMultipleSources) {
        disclaimer += ', which have been cross-validated from multiple sources.';
    } else if (sourceValidation.reliability === 'conflicting') {
        disclaimer += '. **Warning:** Some sources presented conflicting information, which may affect the accuracy of this summary.';
    } else if (contextQuality.ragResultCount > 0 && contextQuality.wikiResultCount === 0) {
        disclaimer += ', primarily from the internal database.';
    } else if (contextQuality.ragResultCount === 0 && contextQuality.wikiResultCount > 0) {
        disclaimer += ', primarily from Wikipedia.';
    }
    
    return `> *${disclaimer}*`;
}