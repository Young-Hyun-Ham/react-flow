import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      ...data,
    };
  });
};

export const createScenario = async ({ newScenarioName, job, user }) => {
  const newScenarioRef = doc(db, 'scenarios', newScenarioName);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  const now = new Date().toISOString();
  const newScenarioData = {
      name: newScenarioName,
      job,
      nodes: [],
      edges: [],
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: now,
      updatedAt: now,
      updatedBy: user.displayName,
      updatedById: user.uid,
  };
  await setDoc(newScenarioRef, newScenarioData);
  return { id: newScenarioName, ...newScenarioData };
};

export const renameScenario = async ({ oldScenario, newName, job, user }) => {
    const oldDocRef = doc(db, 'scenarios', oldScenario.id);
    const now = new Date().toISOString();
    const updateData = { 
        job, 
        updatedBy: user.displayName, 
        updatedById: user.uid,
        updatedAt: now,
    };
  
    if (oldScenario.name !== newName) {
      const newDocRef = doc(db, 'scenarios', newName);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        throw new Error('A scenario with that name already exists.');
      }
  
      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const batch = writeBatch(db);
        const newData = { ...oldDocSnap.data(), name: newName, ...updateData };
        batch.set(newDocRef, newData);
        batch.delete(oldDocRef);
        await batch.commit();
      } else {
        throw new Error('Original scenario not found.');
      }
    } else {
      await updateDoc(oldDocRef, updateData);
    }
};

export const deleteScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
};

export const cloneScenario = async ({ scenarioToClone, newName, user }) => {
  const originalDocRef = doc(db, 'scenarios', scenarioToClone.id);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const originalDocSnap = await getDoc(originalDocRef);
  if (!originalDocSnap.exists()) {
    throw new Error('The scenario to clone does not exist.');
  }

  const now = new Date().toISOString();
  const originalData = originalDocSnap.data();
  const newData = {
    ...originalData,
    name: newName,
    job: scenarioToClone.job,
    authorId: user.uid,
    authorName: user.displayName,
    createdAt: now,
    updatedAt: now,
    updatedBy: user.displayName,
    updatedById: user.uid,
  };

  await setDoc(newDocRef, newData);
  return { id: newName, ...newData };
};


export const fetchScenarioData = async ({ scenarioId }) => {
  if (!scenarioId) return { nodes: [], edges: [] };
  const scenarioDocRef = doc(db, "scenarios", scenarioId);
  const docSnap = await getDoc(scenarioDocRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  console.log(`No such document for scenario: ${scenarioId}!`);
  return { nodes: [], edges: [] };
};

export const saveScenarioData = async ({ scenario, data, user }) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }
  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  const now = new Date().toISOString();
  const dataToSave = {
    ...data,
    updatedBy: user.displayName,
    updatedById: user.uid,
    updatedAt: now,
  };
  await setDoc(scenarioDocRef, dataToSave, { merge: true });
};

export const fetchApiTemplates = async () => {
  const templatesCollection = collection(db, 'apiTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveApiTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'apiTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteApiTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'apiTemplates', templateId);
  await deleteDoc(templateDocRef);
};

export const fetchFormTemplates = async () => {
  const templatesCollection = collection(db, 'formTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFormTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'formTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteFormTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'formTemplates', templateId);
  await deleteDoc(templateDocRef);
};