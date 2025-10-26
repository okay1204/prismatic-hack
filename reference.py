#Make sure to import these
import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import preprocess_input


IMAGE_SIZE = 64 
MODEL_DIR = "./models"

USED_DATASETS = [
    "bloodmnist",
    "breastmnist",
    "chestmnist",
    "dermamnist",
    "octmnist",
    "organamnist",
    "organcmnist",
    "organsmnist",
    "pathmnist",
    "pneumoniamnist",
    "retinamnist",
    "tissuemnist",
]

STAGE1_MODEL_PATH = os.path.join(MODEL_DIR, "MODEL_PATH.keras")
stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH)

# Cache for stage2 expert models so we don't reload every request
_stage2_cache = {}  # dict: dataset_name -> loaded keras model


--------------

def _load_and_preprocess_single_image_pil(image_source, image_size=IMAGE_SIZE):
    if isinstance(image_source, str):
        # image_source is a path on disk
        img = Image.open(image_source)
    else:
        # assume it's a file-like object (has .read()), e.g. request.FILES['file']
        img = Image.open(image_source)

    # force RGB
    img = img.convert("RGB")

    # resize to model input size
    img = img.resize((image_size, image_size))

    # to numpy and batch it
    img_np = np.array(img, dtype="float32")  # (H, W, 3)
    img_np = np.expand_dims(img_np, axis=0)  # (1, H, W, 3)

    # same normalization that was used in training
    img_np = preprocess_input(img_np)

    return img_np


def _route_dataset(img_batch):
    ds_probs = stage1_model.predict(img_batch, verbose=0)[0]  # (num_datasets,)
    ds_idx = int(np.argmax(ds_probs))
    routed_dataset = USED_DATASETS[ds_idx]
    routed_confidence = float(ds_probs[ds_idx])
    return routed_dataset, routed_confidence, ds_idx


def _load_stage2_model(dataset_name):
    if dataset_name in _stage2_cache:
        return _stage2_cache[dataset_name]

    stage2_path = os.path.join(MODEL_DIR, f"stage2_{dataset_name}_final.keras")
    if not os.path.exists(stage2_path):
        raise FileNotFoundError(
            f"Stage 2 model for dataset '{dataset_name}' not found at {stage2_path}"
        )

    model = tf.keras.models.load_model(stage2_path)
    _stage2_cache[dataset_name] = model
    return model


def _classify_with_stage2(img_batch, dataset_name):
    expert_model = _load_stage2_model(dataset_name)

    class_probs = expert_model.predict(img_batch, verbose=0)[0]  # (num_classes,)
    pred_class_idx = int(np.argmax(class_probs))
    pred_class_conf = float(np.max(class_probs))

    return pred_class_idx, pred_class_conf, class_probs.tolist()

def predict_image(image_source):
    #Preprocessing
    img_batch = _load_and_preprocess_single_image_pil(image_source, image_size=IMAGE_SIZE)

    #Routing
    routed_dataset, routed_confidence, _ = _route_dataset(img_batch)

    #Classification
    pred_class_idx, pred_class_conf, class_probs = _classify_with_stage2(
        img_batch,
        routed_dataset
    )

    #Result
    return {
        "routed_dataset": routed_dataset,
        "router_confidence": routed_confidence,
        "predicted_class_index": pred_class_idx,
        "predicted_class_confidence": pred_class_conf,
        "all_class_probs": class_probs,
    }