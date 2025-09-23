import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc, // --- 💡 수정된 부분: addDoc import 추가 ---
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  // Firestore는 문서 ID 목록만 반환하므로 FastAPI 형식에 맞게 변환
  return querySnapshot.docs.map((doc) => ({ id: doc.id, name: doc.id }));
};

export const createScenario = async ({ newScenarioName }) => {
  const newScenarioRef = doc(db, 'scenarios', newScenarioName);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  await setDoc(newScenarioRef, { nodes: [], edges: [] });
  // 반환값을 FastAPI 형식과 맞춤
  return { id: newScenarioName, name: newScenarioName, nodes: [], edges: [] };
};

export const renameScenario = async ({ oldScenario, newName }) => {
  const oldDocRef = doc(db, 'scenarios', oldScenario.name);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const oldDocSnap = await getDoc(oldDocRef);
  if (oldDocSnap.exists()) {
    const batch = writeBatch(db);
    batch.set(newDocRef, oldDocSnap.data());
    batch.delete(oldDocRef);
    await batch.commit();
  } else {
    throw new Error('Original scenario not found.');
  }
};

export const deleteScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
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

export const saveScenarioData = async ({ scenario, data }) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }
  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  await setDoc(scenarioDocRef, data);
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